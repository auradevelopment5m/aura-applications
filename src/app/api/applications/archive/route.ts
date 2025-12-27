import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getServerSession } from "next-auth"
import { authOptions, isAdmin } from '@/lib/auth'

const archiveFilePath = path.join(process.cwd(), 'data', 'archived_applications.json')

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.discord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isAdmin(session.discord.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const dataDir = path.join(process.cwd(), 'data')
    try {
      await fs.access(dataDir)
    } catch {
      await fs.mkdir(dataDir, { recursive: true })
    }

    try {
      const data = await fs.readFile(archiveFilePath, 'utf8')
      return NextResponse.json(JSON.parse(data))
    } catch {
      await fs.writeFile(archiveFilePath, '[]', 'utf8')
      return NextResponse.json([])
    }
  } catch (error) {
    console.error('Error in archive route:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

