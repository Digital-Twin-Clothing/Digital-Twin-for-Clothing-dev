import { Datastore } from "@google-cloud/datastore";

// On Cloud Run this authenticates with the service account automatically.
// Locally it uses `gcloud auth application-default login`.
const globalForDb = globalThis as unknown as { datastore?: Datastore };

export const db = globalForDb.datastore ?? new Datastore({ projectId: process.env.GCP_PROJECT_ID });

if (process.env.NODE_ENV !== "production") globalForDb.datastore = db;
