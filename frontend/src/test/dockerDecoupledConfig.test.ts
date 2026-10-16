import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Decoupled Docker Compose Configurations', () => {
  it('has standalone docker-compose.frontend.yml with frontend service and no engine dependency', () => {
    const file = path.resolve(process.cwd(), 'docker-compose.frontend.yml')
    expect(fs.existsSync(file)).toBe(true)
    const content = fs.readFileSync(file, 'utf-8')
    expect(content).toContain('container_name: aiva-portal-frontend')
    expect(content).toContain('Dockerfile.frontend')
    expect(content).not.toContain('container_name: aiva-matching-engine')
    expect(content).not.toContain('depends_on:')
  })

  it('has standalone docker-compose.engine.yml with PORTAL_CALLBACK_URL environment variable', () => {
    const file = path.resolve(process.cwd(), 'docker-compose.engine.yml')
    expect(fs.existsSync(file)).toBe(true)
    const content = fs.readFileSync(file, 'utf-8')
    expect(content).toContain('container_name: aiva-matching-engine')
    expect(content).toContain('PORTAL_CALLBACK_URL')
    expect(content).not.toContain('container_name: aiva-portal-frontend')
  })

  it('has profiles configured in docker-compose.prod.yml for flexible independent deployment', () => {
    const file = path.resolve(process.cwd(), 'docker-compose.prod.yml')
    expect(fs.existsSync(file)).toBe(true)
    const content = fs.readFileSync(file, 'utf-8')
    expect(content).toContain('profiles:')
  })
})
