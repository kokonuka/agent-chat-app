import { AIMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { ConfigurationSchema, ensureConfiguration } from "./configuration.js";
import { TOOLS } from "./tools.js";
import { loadChatModel } from "./utils.js";

// モデルを呼び出す関数を定義します
async function callModel(
  state: typeof MessagesAnnotation.State,
  config: RunnableConfig
): Promise<typeof MessagesAnnotation.Update> {
  /** エージェントを動かすLLMを呼び出します。 **/
  const configuration = ensureConfiguration(config);

  // プロンプト、モデル、その他のロジックは自由にカスタマイズしてください！
  const model = (await loadChatModel(configuration.model)).bindTools(TOOLS);

  const response = await model.invoke([
    {
      role: "system",
      content: configuration.systemPromptTemplate.replace(
        "{system_time}",
        new Date().toISOString()
      ),
    },
    ...state.messages,
  ]);
  // 既存のリストに追加されるため、リストを返します
  return { messages: [response] };
}

// 続行するかどうかを決定する関数を定義します
function routeModelOutput(state: typeof MessagesAnnotation.State): string {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  // LLMがツールを呼び出している場合は、そこにルーティングします。
  if ((lastMessage as AIMessage)?.tool_calls?.length || 0 > 0) {
    return "tools";
  }
  // それ以外の場合はグラフを終了します。
  else {
    return "__end__";
  }
}

// 新しいグラフを定義します。状態を定義するために、事前に構築されたMessagesAnnotationを使用します:
// https://langchain-ai.github.io/langgraphjs/concepts/low_level/#messagesannotation
const workflow = new StateGraph(MessagesAnnotation, ConfigurationSchema)
  // サイクルさせる2つのノードを定義します
  .addNode("callModel", callModel)
  .addNode("tools", new ToolNode(TOOLS))
  // エントリポイントを `callModel` として設定します
  // これは、このノードが最初に呼び出されることを意味します
  .addEdge("__start__", "callModel")
  .addConditionalEdges(
    // まず、エッジのソースノードを定義します。`callModel` を使用します。
    // これは、`callModel` ノードが呼び出された後に取られるエッジであることを意味します。
    "callModel",
    // 次に、シンクノードを決定する関数を渡します。
    // これは、ソースノードが呼び出された後に呼び出されます。
    routeModelOutput
  )
  // これは、`tools` が呼び出された後、次に `callModel` ノードが呼び出されることを意味します。
  .addEdge("tools", "callModel");

// 最後にコンパイルします！
// これにより、呼び出しおよびデプロイ可能なグラフにコンパイルされます。
export const graph = workflow.compile({
  interruptBefore: [], // ツールを呼び出す前に状態を更新したい場合
  interruptAfter: [],
});
