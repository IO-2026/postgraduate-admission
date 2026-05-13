#!/usr/bin/env python3

import json
import time
import uuid
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


def post_multipart(url: str,
                   fields: dict,
                   files: dict,
                   headers: dict | None = None,
                   timeout: float = 10.0):
    boundary = f"----pgadmission-{uuid.uuid4().hex}"
    line_break = "\r\n"
    parts = []

    for name, value in fields.items():
        parts.append(f"--{boundary}")
        parts.append(f'Content-Disposition: form-data; name="{name}"')
        parts.append("Content-Type: application/json")
        parts.append("")
        parts.append(json.dumps(value))

    for name, file_meta in files.items():
        filename, content_type, content = file_meta
        parts.append(f"--{boundary}")
        parts.append(
            f'Content-Disposition: form-data; name="{name}"; filename="{filename}"'
        )
        parts.append(f"Content-Type: {content_type}")
        parts.append("")
        parts.append(content)

    parts.append(f"--{boundary}--")
    parts.append("")

    body = b""
    for part in parts:
        if isinstance(part, bytes):
            body += part + line_break.encode("utf-8")
        else:
            body += part.encode("utf-8") + line_break.encode("utf-8")

    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
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
    jwt = login_json["token"]

    application_payload = {
        "university": "Test University",
        "courseId": 1,
        "applicantDateOfBirth": "1990-01-01",
        "applicantPesel": "90010101234",
        "addressStreet": "Testowa 1",
        "addressPostalCode": "30-059",
        "addressCity": "Kraków",
        "previousDegree": "Inżynier",
        "fieldOfStudy": "Informatyka",
        "graduationYear": 2015,
        "truthfulnessConsent": True,
        "gdprConsent": True,
    }

    fake_pdf = b"%PDF-1.4\n%fake\n"

    submit_status, submit_body = post_multipart(
        f"{base}/api/applications/submit",
        fields={"application": application_payload},
        files={"diploma": ("diploma.pdf", "application/pdf", fake_pdf)},
        headers={"Authorization": f"Bearer {jwt}"},
        timeout=90.0,
    )

    print("register", reg_status)
    print("login", login_status)
    print("submit", submit_status)
    print("submit_body", submit_body[:400])


if __name__ == "__main__":
    main()
