import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calendar, ClipboardCheck, BookOpen } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    upcomingExams: 0,
    todayAttendance: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Get total students
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })

      // Get total courses
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })

      // Get upcoming exams (next 7 days)
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      
      const { count: examsCount } = await supabase
        .from('exams')
        .select('*', { count: 'exact', head: true })
        .gte('exam_datetime', new Date().toISOString())
        .lte('exam_datetime', nextWeek.toISOString())

      // Get today's attendance
      const today = new Date().toISOString().split('T')[0]
      const { count: attendanceCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', `${today}T00:00:00`)
        .lt('timestamp', `${today}T23:59:59`)

      setStats({
        totalStudents: studentsCount || 0,
        totalCourses: coursesCount || 0,
        upcomingExams: examsCount || 0,
        todayAttendance: attendanceCount || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      description: 'Registered students',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Total Courses',
      value: stats.totalCourses,
      description: 'Available courses',
      icon: BookOpen,
      color: 'text-green-600'
    },
    {
      title: 'Upcoming Exams',
      value: stats.upcomingExams,
      description: 'Next 7 days',
      icon: Calendar,
      color: 'text-orange-600'
    },
    {
      title: 'Today\'s Attendance',
      value: stats.todayAttendance,
      description: 'Verified students',
      icon: ClipboardCheck,
      color: 'text-purple-600'
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the Student Verification Assistant Admin Portal
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>
              Student Verification Assistant Terminal Status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database Status</span>
                <span className="text-sm text-green-600">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Storage Status</span>
                <span className="text-sm text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Authentication</span>
                <span className="text-sm text-green-600">Enabled</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">• Register new students</p>
              <p className="text-sm">• Schedule upcoming exams</p>
              <p className="text-sm">• Download attendance reports</p>
              <p className="text-sm">• Manage course assignments</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

