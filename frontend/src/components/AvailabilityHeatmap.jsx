import React, { useMemo } from 'react'
import './AvailabilityHeatmap.css'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const timeSlots = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'
]

const AvailabilityHeatmap = ({ students }) => {
  const heatmapData = useMemo(() => {
    const data = {}
    // Initialize
    days.forEach(day => {
      data[day] = {}
      timeSlots.forEach(slot => {
        data[day][slot] = 0
      })
    })

    let validStudentsCount = 0

    students.forEach(student => {
      if (!student.availability) return
      let avail = student.availability
      if (typeof avail === 'string') {
        try {
          avail = JSON.parse(avail)
        } catch (e) {
          return
        }
      }
      
      // Check if availability object is empty
      if (Object.keys(avail).length === 0) return

      validStudentsCount++
      
      Object.keys(avail).forEach(day => {
        if (data[day]) {
          Object.keys(avail[day]).forEach(slot => {
            if (avail[day][slot] && data[day][slot] !== undefined) {
              data[day][slot]++
            }
          })
        }
      })
    })

    return { data, count: validStudentsCount }
  }, [students])

  const { data, count } = heatmapData

  if (count === 0) {
    return <div className="no-data" style={{ padding: '1rem', fontSize: '0.9rem' }}>No availability data available for these students.</div>
  }

  return (
    <div className="availability-heatmap">
      <div className="heatmap-grid">
        <div className="heatmap-header-cell"></div>
        {days.map(day => (
          <div key={day} className="heatmap-header-cell">{day.slice(0, 3)}</div>
        ))}
        
        {timeSlots.map(slot => (
          <React.Fragment key={slot}>
            <div className="heatmap-time-label">{slot.replace(':00 ', '')}</div>
            {days.map(day => {
              const value = data[day][slot]
              const ratio = value / count
              const alpha = ratio // 0 to 1
              // Green is roughly 76, 175, 80
              const backgroundColor = `rgba(76, 175, 80, ${alpha})`
              
              return (
                <div 
                  key={`${day}-${slot}`} 
                  className="heatmap-cell"
                  style={{ backgroundColor }}
                  data-tooltip={`${day} ${slot}: ${value}/${count}`}
                  title={`${day} ${slot}: ${value}/${count}`}
                />
              )
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="heatmap-legend">
        <span>0%</span>
        <div className="legend-gradient"></div>
        <span>100% ({count} students)</span>
      </div>
    </div>
  )
}

export default AvailabilityHeatmap
