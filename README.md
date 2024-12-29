# CB Central CLI

CB Central CLI is a command-line interface tool designed to interact with cryptocurrency-related functionality. This guide will walk you through how to set it up, link it locally, and use it.

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)

## Installation

1. Clone this repository:

   ````bash
   git clone <repository-url>
   cd cb-central-cli```

   ````

2. Install dependencies: `npm install`
3. Link the CLI locally for development: `npm link`

This command creates a global symbolic link, allowing you to use the CLI as a global command.

## Usage

Once linked, you can run the CLI using the command: `crypto-cli`

## Local Development

To enable easier development without needing to re-run npm link after every change, use the following npm script: `npm run dev`
This command runs the CLI directly using Node.js without requiring the global link.
