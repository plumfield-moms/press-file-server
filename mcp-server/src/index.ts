import { Worker } from "@notionhq/workers";
import { j } from "@notionhq/workers/schema-builder";

type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

const worker = new Worker();
export default worker;
interface DBData extends Record<string, JSONValue> {
  id: string;
  book_title: string;
  created_at: number;
  updated_at: number;
  current_stage: string;
}

async function GetProofs(
  _input: JSONValue,
  _context: unknown,
): Promise<JSONValue> {
  const clientId = process.env.ClientId;
  const clientSecret = process.env.ClientSecret;

  if (!clientId || !clientSecret) {
    throw new Error(
      "ClientId and ClientSecret environment variables must be set",
    );
  }

  const response = await fetch("https://server.plumfieldpress.com/api/proofs", {
    headers: {
      "CF-Access-Client-Id": clientId,
      "CF-Access-Client-Secret": clientSecret,
    },
  }).catch((err) => {
    throw new Error(String(err ?? "Fetch failed"));
  });

  if (!response.ok) {
    throw new Error(`Fetch failed with status ${response.status}`);
  }
  const data = (await response.json()) as DBData[];

  return data;
}

worker.tool("getAllProofs", {
  title: "Get All Proofs",
  description: "Gets all proofs and their current status",
  schema: j.object({}),
  outputSchema: j.array(
    j.object({
      id: j.string(),
      book_title: j.string(),
      created_at: j.number(),
      updated_at: j.number(),
      current_stage: j.string(),
    }),
  ),
  execute: GetProofs,
});
