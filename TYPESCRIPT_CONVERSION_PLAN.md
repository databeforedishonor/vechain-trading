# TypeScript Conversion Plan

This document outlines the plan for converting the JavaScript codebase to TypeScript.

## Completed Conversions

- ✅ `src/core/connector.js` → `src/core/connector.ts`
- ✅ `scripts/queries/query-testnet.js` → `scripts/queries/query-testnet.ts`
- ✅ `scripts/balances/vechain-check-balances.js` → `scripts/balances/vechain-check-balances.ts`

## Files to Convert

### src/core
- [ ] `transaction.js` → `transaction.ts`
- [ ] `contracts.js` → `contracts.ts`

### src (root)
- [ ] `config.js` → `config.ts`
- [ ] `index.js` → `index.ts`

### scripts/balances
- [ ] `get-balances.js` → `get-balances.ts`
- [ ] `get-vet-vtho-amounts.js` → `get-vet-vtho-amounts.ts`

### scripts/queries
- [ ] `find-dex-contracts.js` → `find-dex-contracts.ts`

### scripts/quotes
- [ ] `vechain-dex-quote.js` → `vechain-dex-quote.ts`
- [ ] `price-quotes.js` → `price-quotes.ts`

## How to Convert a File

1. Create a new file with the `.ts` extension
2. Copy the contents of the JavaScript file
3. Add TypeScript types and interfaces
4. Convert `require()` statements to `import` statements
5. Convert `module.exports` to `export default` or named exports
6. Run TypeScript type checking with `npx tsc --noEmit`
7. Test the converted file

## TypeScript Configuration

The project is configured with a `tsconfig.json` file that includes:

- ES2020 target
- CommonJS modules
- Source maps and declaration files
- Support for both JavaScript and TypeScript files

## Running the TypeScript Files

New npm scripts have been added to run the TypeScript files:

```json
"query:testnet": "ts-node scripts/queries/query-testnet.ts",
"check:balances": "ts-node scripts/balances/vechain-check-balances.ts"
```

## Dependencies Added

- `typescript`
- `ts-node`
- `@types/node`
- `@types/bip39`
- `@types/hdkey`

## Best Practices for TypeScript Conversion

1. Start with interface definitions for the main data structures
2. Add return types to functions
3. Use union types for flexible parameters
4. Define enums for constants
5. Use generics for reusable code
6. Add proper error handling with typed errors

## Running Type Checking

To check TypeScript types without emitting JavaScript files:

```bash
npx tsc --noEmit
```

## Converting the Entire Repository

To automate the conversion process, a helper script has been added:

```json
"convert:js-to-ts": "tsc --allowJs --declaration --emitDeclarationOnly"
```

This will generate type definition files for JavaScript files, which can be used as a starting point for conversion. 