import { Storage } from "@google-cloud/storage";

const bucketName = () => {
  const name = process.env.GCS_BUCKET;
  if (!name) throw new Error("GCS_BUCKET is not set");
  return name;
};

export async function uploadObject(path: string, data: Buffer, contentType: string) {
  await new Storage().bucket(bucketName()).file(path).save(data, { contentType, resumable: false });
  return `gs://${bucketName()}/${path}`;
}

/** Reads an object from a gs://bucket/path URL that we previously saved. */
export async function readObject(gsUrl: string): Promise<{ data: Buffer; contentType: string }> {
  const m = /^gs:\/\/([^/]+)\/(.+)$/.exec(gsUrl);
  if (!m || m[1] !== bucketName()) throw new Error("Unexpected storage path");
  const file = new Storage().bucket(m[1]).file(m[2]);
  const [[data], [meta]] = await Promise.all([file.download(), file.getMetadata()]);
  return { data, contentType: (meta.contentType as string) || "application/octet-stream" };
}
