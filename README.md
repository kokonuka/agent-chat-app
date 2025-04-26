# create-agent-chat-app

LangGraph エージェントチャットアプリケーションを素早くセットアップするための CLI ツールです。

これにより、フロントエンドのチャットアプリケーション（Next.js または Vite）と、最大4つの事前構築済みエージェントがクローンされます。このコードを使って LangGraph アプリケーションを始めたり、事前構築済みエージェントをテストしたりできます！

![CLI 使用 GIF](./static/demo.gif)

## 使い方

### クイックスタート

最も早く始める方法は、プロンプトを経由せずに CLI にフラグを渡すことです。

```bash
# `-Y`/`--yes` を渡してすべてのデフォルト値を受け入れる
npx create-agent-chat-app@latest -Y
```

個別のフラグを渡すこともできます。CLI が受け入れるすべてのオプションとそのデフォルト値は以下の通りです。

```bash
npx create-agent-chat-app@latest --help
```

```
使用法: create-agent-chat-app [options]

1つのコマンドでエージェントチャットアプリを作成

オプション:
  -V, --version                バージョン番号を出力
  -Y, --yes                    すべてのプロンプトをスキップし、デフォルト値を使用
  --project-name <name>        プロジェクト名 (デフォルト: "agent-chat-app")
  --package-manager <manager>  使用するパッケージマネージャー (npm, pnpm, yarn) (デフォルト: "yarn")
  --install-deps <boolean>     依存関係を自動的にインストール (デフォルト: "true")
  --framework <framework>      使用するフレームワーク (nextjs, vite) (デフォルト: "nextjs")
  --include-agent <agent...>   含める事前構築済みエージェント (react, memory, research, retrieval)
  -h, --help                   コマンドのヘルプを表示
```

いくつかのフラグを渡し、残りはデフォルト値を使用したい場合は、渡したいフラグに加えて `-Y`/`--yes` を追加します。

```bash
npx create-agent-chat-app@latest -Y --package-manager pnpm
```

これにより、パッケージマネージャーが `pnpm` に設定される以外は、すべてのデフォルト値が受け入れられます。

### 対話形式

プロンプトを経由したい場合は、以下を実行できます。

```bash
# npx を使用
npx create-agent-chat-app@latest
# または
yarn create agent-chat-app@latest
# または
pnpm create agent-chat-app@latest
# または
bunx create-agent-chat-app@latest
```

次に、プロジェクト名、パッケージマネージャー、Web フレームワーク、そしてデフォルトで含めるエージェント（もしあれば）を尋ねられます。

```
◇  プロジェクト名は何ですか？
◇  どのパッケージマネージャーを使用しますか？ › npm | pnpm | yarn
◇  依存関係を自動的にインストールしますか？ … y / N
◇  どのフレームワークを使用しますか？ › Next.js | Vite
```

次に、含めるエージェントを選択するよう促されます。デフォルトではすべてが選択されています。

利用可能なエージェントは以下の通りです。

- [React Agent](https://github.com/langchain-ai/react-agent-js)
- [Memory Agent](https://github.com/langchain-ai/memory-agent-js)
- [Research Agent](https://github.com/langchain-ai/rag-research-agent-template-js)
- [Retrieval Agent](https://github.com/langchain-ai/retrieval-agent-template-js)

```
◆  どの事前構築済みエージェントを含めますか？ (選択/選択解除するには "スペース" を押してください)
│  ◼ ReAct Agent
│  ◼ Memory Agent
│  ◼ Research Agent
│  ◼ Retrieval Agent
└
```

プロンプトを完了すると、プロジェクトディレクトリに必要なすべてのファイルとフォルダが自動的に作成されます。依存関係の自動インストールを選択した場合、それらがインストールされます。

## セットアップ

プロジェクトディレクトリに移動します。

```bash
# agent-chat-app はデフォルトのプロジェクト名です
cd agent-chat-app
```

`.env.example` ファイルを `.env` にコピーします。

```bash
cp .env.example .env
```

これには、エージェントが実行するために必要なすべての機密情報が含まれます。

最後に、開発サーバーを起動します。このコマンドは、Web サーバーと LangGraph サーバーの両方を起動します。

```bash
npm run dev
# または
pnpm dev
# または
yarn dev
```

個別に実行したい場合は、プロジェクトのルートから Turbo コマンドを実行することで可能です。

Web:

```bash
npm turbo dev --filter=web
# または
pnpm turbo dev --filter=web
# または
yarn turbo dev --filter=web
```

LangGraph:

```bash
npm turbo dev --filter=agents
# または
pnpm turbo dev --filter=agents
# または
yarn turbo dev --filter=agents
```

または、各ワークスペースに移動して `dev` を実行することもできます。

Web:

```bash
cd apps/web

npm run dev
# または
pnpm dev
# または
yarn dev
```

LangGraph:

```bash
cd apps/agents

npm run dev
# または
pnpm dev
# または
yarn dev
```

サーバーが起動したら、ブラウザで `http://localhost:3000` (Vite の場合は `http://localhost:5173`) にアクセスできます。そこでは、以下を入力するよう促されます。

- **Deployment URL**: LangGraph サーバーの API URL。このパッケージに同梱されている LangGraph サーバーは `http://localhost:2024` で実行するように設定されているため、デフォルト値を使用する必要があります。
- **Assistant/Graph ID**: チャットインターフェース経由で実行を取得および送信する際に使用するグラフの名前、またはアシスタントの ID。ReAct エージェントを選択した場合、デフォルト値の `agent` を使用して接続できます。それ以外の場合は、`langgraph.json` ファイルを参照して、接続したいエージェントのグラフ ID を確認してください。
- **LangSmith API Key**: このフィールドはローカル開発には必須ではありません。LangGraph サーバーに送信されるリクエストを認証する際に使用する LangSmith API キー。

これらの値を入力した後、`Continue` をクリックします。その後、LangGraph サーバーとチャットを開始できるチャットインターフェースにリダイレクトされます。

## なぜ Create Agent Chat App を使うのか？

このツールは、LangGraph チャットアプリケーションを素早く始めるための方法です。[Agent Chat UI](https://github.com/langchain-ai/agent-chat-ui) リポジトリに基づいており、デフォルトで4つの事前構築済みエージェントが同梱されています。

Agent Chat UI を使用することで、これらのエージェントと対話し、チャットすることができます。