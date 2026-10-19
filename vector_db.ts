import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddings } from "./agents/CREATE_EMBEDDINGS";

export const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
  url: process.env.QDRANT_URL,
  collectionName: "nodejsDocumentation",
  apiKey:process.env.QDRANT_API_KEY
});