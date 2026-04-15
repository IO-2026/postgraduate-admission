async function test() {
  try {
    const email = "testcourse3@example.com";
    const password = "password123";
    
    // 1. Register temporary user
    console.log("Registering user...");
    await fetch("http://localhost:8080/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
          email: email, 
          password: password, 
          name: "AA", 
          surname: "BB",
          telNumber: "123456789",
          roleId: 1
      })
    });

    // 2. Login
    console.log("Logging in...");
    const loginRes = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password })
    });
    
    if(!loginRes.ok) {
        console.log("Login failed", loginRes.status, await loginRes.text());
        return;
    }
    const loginData = await loginRes.json();
    const jwt = loginData.token;
    console.log("Got JWT");

    // 3. Create course
    console.log("Creating course...");
    const courseRes = await fetch("http://localhost:8080/api/courses", {
      method: "POST",
      headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`
      },
      body: JSON.stringify({ name: "Test Course", description: "Desc", price: 100 })
    });
    console.log("Course response:", courseRes.status, await courseRes.text());

  } catch (e) {
    console.error(e);
  }
}
test();
