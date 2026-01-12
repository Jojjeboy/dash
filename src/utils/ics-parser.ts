export interface CalendarEvent {
    uid: string
    summary: string
    description: string
    location?: string
    startTime: Date
    endTime: Date
    teacher?: string
    subject?: string
}

/**
 * Parse ICS calendar file and extract events
 */
export async function parseICS(icsContent: string): Promise<CalendarEvent[]> {
    const events: CalendarEvent[] = []
    const lines = icsContent.split(/\r?\n/)

    let currentEvent: Partial<CalendarEvent> | null = null

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i]?.trim() || ''

        // Handle line continuation (lines starting with space)
        while (i + 1 < lines.length && lines[i + 1]?.match(/^[ \t]/)) {
            i++
            line += lines[i]?.trim() || ''
        }

        if (line === 'BEGIN:VEVENT') {
            currentEvent = {}
        } else if (line === 'END:VEVENT' && currentEvent) {
            if (currentEvent.startTime && currentEvent.endTime && currentEvent.summary) {
                events.push(currentEvent as CalendarEvent)
            }
            currentEvent = null
        } else if (currentEvent) {
            const colonIndex = line.indexOf(':')
            if (colonIndex === -1) continue

            const field = line.substring(0, colonIndex)
            const value = line.substring(colonIndex + 1)

            if (field.startsWith('DTSTART')) {
                currentEvent.startTime = parseICSDate(value)
            } else if (field.startsWith('DTEND')) {
                currentEvent.endTime = parseICSDate(value)
            } else if (field === 'SUMMARY') {
                currentEvent.summary = value.replace(/\\,/g, ',').replace(/\\\\/g, '\\')
                // Extract teacher from summary (e.g., "MA, LC" -> teacher: "LC")
                if (currentEvent.summary) {
                    const parts = currentEvent.summary.split(',').map(s => s.trim())
                    if (parts.length > 1) {
                        currentEvent.teacher = parts[parts.length - 1]
                        currentEvent.subject = parts.slice(0, -1).join(', ')
                    } else {
                        currentEvent.subject = currentEvent.summary
                    }
                }
            } else if (field === 'DESCRIPTION') {
                currentEvent.description = value.replace(/<[^>]*>/g, '').replace(/\\n/g, '\n')
            } else if (field === 'LOCATION') {
                currentEvent.location = value
            } else if (field === 'UID') {
                currentEvent.uid = value
            }
        }
    }

    return events
}

/**
 * Parse ICS date format (YYYYMMDDTHHMMSSZ) to Date object
 */
function parseICSDate(dateStr: string): Date {
    // Remove timezone indicator
    dateStr = dateStr.replace(/Z$/, '')

    const year = parseInt(dateStr.substring(0, 4))
    const month = parseInt(dateStr.substring(4, 6)) - 1
    const day = parseInt(dateStr.substring(6, 8))
    const hour = parseInt(dateStr.substring(9, 11))
    const minute = parseInt(dateStr.substring(11, 13))
    const second = parseInt(dateStr.substring(13, 15))

    // Create UTC date and convert to local time
    return new Date(Date.UTC(year, month, day, hour, minute, second))
}

/**
 * Get events for a specific date
 */
export function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    return events.filter(event => {
        const eventDate = new Date(event.startTime)
        eventDate.setHours(0, 0, 0, 0)
        return eventDate.getTime() === targetDate.getTime()
    }).sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
}

/**
 * Generate consistent color for a subject
 */
export function getSubjectColor(subject: string): string {
    // Simple hash function to generate consistent color
    let hash = 0
    for (let i = 0; i < subject.length; i++) {
        hash = subject.charCodeAt(i) + ((hash << 5) - hash)
    }

    const hue = Math.abs(hash % 360)
    const saturation = 65 + (Math.abs(hash) % 20)
    const lightness = 50 + (Math.abs(hash >> 8) % 15)

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}
