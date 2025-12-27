import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const dataFilePath = path.join(process.cwd(), 'data', 'applications.json')

export async function POST(req: Request) {
  try {
    const application = await req.json()

    let applications = []
    try {
      const data = await fs.readFile(dataFilePath, 'utf8')
      applications = JSON.parse(data)
    } catch {
    }

    const newApplication = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...application
    }
    applications.push(newApplication)

    await fs.writeFile(dataFilePath, JSON.stringify(applications, null, 2))

    return NextResponse.json({ message: 'Application submitted successfully' })
  } catch (error) {
    console.error('Error saving application:', error)
    return NextResponse.json({ error: 'Failed to save application' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const data = await fs.readFile(dataFilePath, 'utf8')
    const applications = JSON.parse(data)
    return NextResponse.json(applications)
  } catch (error) {
    console.error('Error reading applications:', error)
    return NextResponse.json({ error: 'Failed to read applications' }, { status: 500 })
  }
}

