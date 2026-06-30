# 🏙️ Solvuno — Civic Intelligence Platform

**Your city. Your voice. Your fix.**

Solvuno is an AI-powered civic reporting platform designed to bridge the gap between residents and municipal governments. By leveraging generative AI, real-time geolocation, and gamification, Solvuno transforms urban infrastructure monitoring from a slow, bureaucratic process into a highly engaging, community-driven movement.

---

# The Problem
Cities suffer from deteriorating infrastructure—potholes, broken streetlights, illegal dumping, and damaged public utilities. Traditional reporting systems (like 311 or government portals) are often outdated, lack transparency, and are riddled with spam or duplicate reports. Residents feel ignored, and municipal workers are overwhelmed by unverified data.

#💡 Our Solution
Solvuno modernizes civic engagement by combining crowd-sourced reporting with intelligent verification. 

### Key Features
* 🛡️ **AI Spam Shield (Gemini API)**: Every issue submitted is instantly analyzed by Google's Gemini AI. The AI evaluates the description and imagery to verify authenticity, actively blocking spam, offensive content, or duplicate reports before they ever reach the database.
* 📍 **Live Interactive Map (Google Maps)**: A sleek, real-time map built on `@vis.gl` that auto-tracks the user's location. It visually plots verified civic issues across the city using custom UI markers, allowing users to instantly see the health of their neighborhood.
### 🎮 Civic Gamification & Community Verification
To ensure high-quality data and incentivize active citizenship, Solvuno employs a robust gamification and crowd-sourced verification loop:

* **Bounty Points (BP) & Leaderboards**: Users earn BP for reporting legitimate issues and contributing to the platform. Highly active users climb the **10km Proximity Leaderboard**, competing against neighbors to become the top civic contributor in their local radius.
* **Civic Bounty Shop**: Users can spend their hard-earned BP in the integrated Bounty Shop to unlock exclusive profile cosmetics, such as glowing avatar borders and unique civic titles (e.g., "Neighborhood Watch" or "Pothole Patrol").
* **Community Upvote / Downvote**: Once an issue is reported, local residents can Upvote it to confirm its existence or Downvote it if it is resolved or fraudulent. This creates a self-moderating ecosystem where the community crowdsources ground-truth verification.
* **Verify Fix Mechanism**: When a reported issue is marked as "Resolved" (e.g., a pothole is filled), the original reporter or community members can submit a "Verify Fix". This officially closes the issue loop, granting bonus BP to users who verify the resolution and cleaning up the live map.
* **Predictive AI Insights**: Solvuno doesn't just collect data; it analyzes it. A dedicated Insights Dashboard uses generative AI to analyze city-wide trends, predicting infrastructure failures and providing automated, actionable reports for city planners.
* ⚡ **True Real-Time Location**: A custom-built geolocation engine bypasses common browser tracking bugs by polling raw GPS data, falling back to IP-based location estimation if hardware GPS is unavailable.

---

## 🛠️ Tech Stack

We built Solvuno with a modern, highly scalable architecture tailored for performance and stunning aesthetics.

### Frontend
* **React 19 & Vite**: Ultra-fast rendering and modular component architecture.
* **Tailwind CSS V4 & Framer Motion**: Premium, responsive UI featuring glassmorphism, micro-animations, and dynamic visual hierarchies.
* **Google Maps API**: Advanced, high-performance mapping integration.

### Backend & Cloud
* **Node.js & Express**: A lightweight, robust backend seamlessly bundled with the frontend using ESBuild.
* **MongoDB**: A flexible, schema-driven NoSQL database handling complex spatial queries and user gamification states.
* **Firebase Auth**: Secure, scalable authentication ensuring verified human interactions.
* **Google GenAI (Gemini)**: Powering our unstructured data analysis and image verification systems.
* **Google Cloud Run**: The entire full-stack application is containerized via Cloud Buildpacks and deployed serverlessly on Google Cloud for infinite scalability.

---

1. **Immediate Real-World Impact**: It solves a universal, physical problem that every judge can relate to (infrastructure decay).
2. **Innovative AI Application**: We aren't just using AI as a chatbot; we are using it as an **automated bureaucratic filter** to process physical-world data.
3. **Flawless Execution**: From the custom geolocation fallback protocols to the enterprise-grade Google Cloud deployment and premium glassmorphic UI, Solvuno is built like a production-ready startup, not just a weekend hack.

---
🚨 Automated Emergency Escalation: When a reported issue receives high community upvotes and is flagged as 'high severity' by the AI, the system automatically escalates the issue to local authorities. (Currently mocked via simulated terminal dispatches for the hackathon).
### What's Next?
In the future, we plan to integrate direct API webhooks to municipal ticketing systems (like Salesforce or Jira) so verified Solvuno reports automatically generate work orders for city maintenance crews.
