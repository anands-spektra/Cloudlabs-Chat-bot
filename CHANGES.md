# What We Updated This Session

## Fixes

**File upload was broken (showing "Not Found" error)**
The Knowledge Base upload button wasn't working at all. We tracked it down to a leftover server process running old code in the background — it was intercepting requests before they could reach the new upload feature. We shut those down, installed a missing package the upload feature needed, and also fixed a mismatch between the port the frontend was running on and what the server was allowing. Uploads now go through cleanly.

---

## Chatbot Improvements

**Richer welcome message**
When a user opens the chat for the first time, the bot now greets them with a friendly, structured message that clearly lists what it can help with — VM issues, lab deployment, sign-in problems, copy-paste, validation, billing, and more. Previously it was a single generic line.

**5 clickable suggestion cards**
Instead of 4 small text pills, the chat now shows 5 larger clickable cards, each with an emoji and a real support scenario:
- 🔌 My Lab VM is not connecting
- 📋 Validation is failing
- 📎 Copy/Paste is not working
- 🔑 Unable to sign in to the VM
- 🚀 Lab deployment failed

Clicking any card sends it as a message instantly.

**Bot icon in the chat header**
The chat window header and loading screen were showing plain "AI" text. These now show the proper bot avatar icon to match the rest of the chat interface.

**Bot avatar now gently floats**
The bot icon next to each AI reply now has a subtle up-and-down floating animation, making the chat feel more lively and polished.

---

## Admin Dashboard Improvements

**Cards react when you hover**
The four stat cards (Knowledge Articles, Resolved Queries, etc.) and the four Quick Action cards now lift slightly and cast a soft shadow when you hover over them. It makes the dashboard feel more interactive and modern.
