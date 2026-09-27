# Parquet Sudoku

I am thinking of creating another website that generates puzzles to solve, let's call this project "Parquet sudoku". I want you to build the entire framework using react native.

I'm going to break down all the steps first:

Step 1: Create a 4x4 square grid.
Step 2: Imagine you have these 9 tiles: 1 2x2 tile, 2 1x2 tiles, 2 2x1 tiles, 4 1x1 tiles.
Step 3: Place these 9 tiles into the 4x4 grid such that (i) the 2x2 tiles is right at the middle, (ii) no 1x2 tile touches any 2x1 tile, and (iii) no 1x1 touches each other.
Step 4: Create a button that allows me to randomly generate this grid.

Based on this setup, build the website.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://parquet-sudoku.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/429b7cae-8ce9-49b2-8b88-a2f5afdd9657).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
