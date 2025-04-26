import { RunnableConfig } from "@langchain/core/runnables";
import { StateGraph } from "@langchain/langgraph";
import {
  ConfigurationAnnotation,
  ensureConfiguration,
} from "./configuration.js";
import { StateAnnotation, InputStateAnnotation } from "./state.js";
import { formatDocs, getMessageText, loadChatModel } from "./utils.js";
import { z } from "zod";
import { makeRetriever } from "./retrieval.js";
// モデルを呼び出す関数を定義

const SearchQuery = z.object({
  query: z.string().describe("Search the indexed documents for a query."),
});

async function generateQuery(
  state: typeof StateAnnotation.State,
  config?: RunnableConfig
): Promise<typeof StateAnnotation.Update> {
  const messages = state.messages;
  if (messages.length === 1) {
    // 最初のユーザーからの質問です。入力を直接検索に使用します。
    const humanInput = getMessageText(messages[messages.length - 1]);
    return { queries: [humanInput] };
  } else {
    const configuration = ensureConfiguration(config);
    // プロンプト、モデル、その他のロジックは自由にカスタマイズしてください！
    const systemMessage = configuration.querySystemPromptTemplate
      .replace("{queries}", (state.queries || []).join("\n- "))
      .replace("{systemTime}", new Date().toISOString());

    const messageValue = [
      { role: "system", content: systemMessage },
      ...state.messages,
    ];
    const model = (
      await loadChatModel(configuration.responseModel)
    ).withStructuredOutput(SearchQuery);

    const generated = await model.invoke(messageValue);
    return {
      queries: [generated.query],
    };
  }
}

async function retrieve(
  state: typeof StateAnnotation.State,
  config: RunnableConfig
): Promise<typeof StateAnnotation.Update> {
  const query = state.queries[state.queries.length - 1];
  const retriever = await makeRetriever(config);
  const response = await retriever.invoke(query);
  return { retrievedDocs: response };
}

async function respond(
  state: typeof StateAnnotation.State,
  config: RunnableConfig
): Promise<typeof StateAnnotation.Update> {
  /**
   * この「エージェント」を動かしているLLMを呼び出します。
   */
  const configuration = ensureConfiguration(config);

  const model = await loadChatModel(configuration.responseModel);

  const retrievedDocs = formatDocs(state.retrievedDocs);
  // プロンプト、モデル、その他のロジックは自由にカスタマイズしてください！
  const systemMessage = configuration.responseSystemPromptTemplate
    .replace("{retrievedDocs}", retrievedDocs)
    .replace("{systemTime}", new Date().toISOString());
  const messageValue = [
    { role: "system", content: systemMessage },
    ...state.messages,
  ];
  const response = await model.invoke(messageValue);
  // リストを返します。これは既存のリストに追加されるためです。
  return { messages: [response] };
}

// グラフを定義するためにノードとエッジを配置します
const builder = new StateGraph(
  {
    stateSchema: StateAnnotation,
    // 唯一の入力フィールドはユーザーです
    input: InputStateAnnotation,
  },
  ConfigurationAnnotation
)
  .addNode("generateQuery", generateQuery)
  .addNode("retrieve", retrieve)
  .addNode("respond", respond)
  .addEdge("__start__", "generateQuery")
  .addEdge("generateQuery", "retrieve")
  .addEdge("retrieve", "respond");

// 最後に、コンパイルします！
// これにより、呼び出しやデプロイが可能なグラフにコンパイルされます。
export const graph = builder.compile({
  interruptBefore: [], // ツールを呼び出す前に状態を更新したい場合
  interruptAfter: [],
});

// LangSmithで表示される名前をカスタマイズします
graph.name = "Retrieval Graph";
