const { Client } = require('pg');

async function test() {
  const client = new Client({
    connectionString: "postgres://postgres.jhbqpzwaivcbxzgofjdz:jUwn!nGBFYGj3&@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?tcpKeepAlive=true",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'courses';
    `);
    console.log("Columns:", res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
test();
