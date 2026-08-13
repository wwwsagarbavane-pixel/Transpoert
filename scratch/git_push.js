import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node/index.js'
import fs from 'fs'
import path from 'path'

const dir = 'C:\\Users\\ADMIN\\Downloads\\Create new project'
const repoUrl = 'https://github.com/wwwsagarbavane-pixel/Transpoert.git'

async function getFiles(dirPath) {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    const relPath = path.relative(dir, fullPath).replace(/\\/g, '/')

    if (relPath.startsWith('node_modules') ||
        relPath.startsWith('dist') ||
        relPath.startsWith('.git') ||
        relPath.startsWith('.gemini') ||
        relPath.includes('/node_modules/') ||
        relPath.includes('/dist/')) {
      continue
    }

    if (entry.isDirectory()) {
      files.push(...(await getFiles(fullPath)))
    } else {
      files.push(relPath)
    }
  }
  return files
}

async function main() {
  console.log("1. Initializing Git repository...")
  await git.init({ fs, dir })

  console.log("2. Scanning workspace files to stage...")
  const files = await getFiles(dir)
  console.log(`Found ${files.length} files to track. Staging files...`)

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    try {
      await git.add({ fs, dir, filepath: file })
    } catch (err) {
      console.error(`Error staging ${file}:`, err.message)
    }
    if ((i + 1) % 50 === 0 || i === files.length - 1) {
      console.log(`Staged ${i + 1}/${files.length} files...`)
    }
  }

  console.log("3. Creating commit...")
  const sha = await git.commit({
    fs,
    dir,
    author: {
      name: 'Sagar Bavane',
      email: 'wwwsagarbavane-pixel@users.noreply.github.com'
    },
    message: 'Initial commit of TransportOS ERP codebase'
  })
  console.log(`Commit created successfully! SHA: ${sha}`)
}

main().catch(err => {
  console.error("Git execution error:", err)
})
