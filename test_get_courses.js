async function testGet() {
  try {
    const res = await fetch("http://localhost:8080/api/courses");
    console.log("GET STATUS:", res.status);
    console.log("GET BODY:", await res.text());
  } catch(e) {
    console.error(e);
  }
}
testGet();
