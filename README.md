# Homomorphic Voting System

A simple, educational voting system demonstrating Paillier homomorphic encryption. Built with React and TypeScript.

## Overview

This project implements a privacy-preserving election system using the Paillier cryptosystem. It demonstrates how homomorphic encryption allows computations (like tallying votes) to be performed on encrypted data without ever decrypting it.

The system is divided into three main components:
1. **Voting Booth (Client)**: Encrypts votes locally before sending them to the server.
2. **Untrusted Server**: Aggregates the encrypted votes using homomorphic addition (multiplying ciphertexts).
3. **Election Authority**: Decrypts the final aggregated tally using the private key.

## Features

- **Pure TypeScript Paillier Implementation**: Includes big integer math, prime generation (Miller-Rabin), and modular arithmetic from scratch.
- **Client-Side Encryption**: Votes are encrypted on the voter's device.
- **Homomorphic Tallying**: The server computes the final result without knowing individual votes.
- **Modern UI**: Built with React, Tailwind CSS, and Lucide icons for a clean, educational interface.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)

## How to Run Locally

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/Crowwida/homomorphic_voting_system.git
   cd homomorphic_voting_system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:5173` (or the port shown in your terminal) to view the application.

## Project Structure

- `src/App.tsx`: The main React component containing the UI and application logic.
- `src/utils/paillier.ts`: The core cryptographic implementation of the Paillier cryptosystem.
- `src/index.css`: Tailwind CSS configuration and global styles.

## Educational Purpose

This project was created as an educational demonstration of homomorphic encryption and privacy-preserving computation. It is **not** intended for use in real-world, high-stakes elections, as a production-ready system would require significantly larger key sizes (e.g., 2048-bit or 4096-bit primes), robust zero-knowledge proofs (to ensure a voter only casts one valid vote), and a secure distributed architecture.
