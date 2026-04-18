#!/usr/bin/env python3

import json
import time
import urllib.error
import urllib.request


def post(url: str, payload: dict, headers: dict | None = None, timeout: float = 10.0):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")


def main():
    base = "http://localhost:8080"
    email = f"copilot{int(time.time())}@example.com"
    pw = "Password123"

    reg_status, reg_body = post(
        f"{base}/api/auth/register",
        {
            "name": "Test",
            "surname": "User",
            "telNumber": "123456789",
            "email": email,
            "password": pw,
            "roleId": 1,
        },
    )

    login_status, login_body = post(
        f"{base}/api/auth/login",
        {"email": email, "username": email, "password": pw},
    )

    login_json = json.loads(login_body)
    uid = login_json["id"]
    jwt = login_json["token"]

    submit_status, submit_body = post(
        f"{base}/api/applications/submit",
        {
            "userId": uid,
            "university": "Test University",
            "diplomaUrl": "https://example.com/diploma.pdf",
            "courseId": 1,
        },
        headers={"Authorization": f"Bearer {jwt}"},
        timeout=90.0,
    )

    print("register", reg_status)
    print("login", login_status)
    print("submit", submit_status)
    print("submit_body", submit_body[:400])


if __name__ == "__main__":
    main()
