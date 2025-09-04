import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Download, FileText, Calendar, Users } from 'lucide-react'

export default function AttendanceManagement() {
  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState('')
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchExams()
  }, [])

  useEffect(() => {
    if (selectedExam) {
      fetchAttendance()
    }
  }, [selectedExam])

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select(`
          *,
          courses (
            course_code,
            course_name
          )
        `)
        .order('exam_datetime', { ascending: false })

      if (error) throw error
      setExams(data || [])
    } catch (error) {
      setError('Error fetching exams: ' + error.message)
    }
  }

  const fetchAttendance = async () => {
    if (!selectedExam) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          students (
            name,
            matric_number,
            department,
            faculty
          ),
          exams (
            exam_datetime,
            courses (
              course_code,
              course_name
            )
          )
        `)
        .eq('exam_id', selectedExam)
        .order('timestamp', { ascending: false })

      if (error) throw error
      setAttendance(data || [])
    } catch (error) {
      setError('Error fetching attendance: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = () => {
    if (attendance.length === 0) {
      setError('No attendance data to download')
      return
    }

    const selectedExamData = exams.find(exam => exam.id.toString() === selectedExam)
    
    // Create CSV content
    const headers = [
      'Student Name',
      'Matriculation Number',
      'Department',
      'Faculty',
      'Verification Status',
      'Timestamp',
      'Course Code',
      'Course Name',
      'Exam Date'
    ]

    const csvContent = [
      headers.join(','),
      ...attendance.map(record => [
        `"${record.students.name}"`,
        record.students.matric_number,
        `"${record.students.department}"`,
        `"${record.students.faculty}"`,
        record.verification_status,
        new Date(record.timestamp).toLocaleString(),
        record.exams.courses.course_code,
        `"${record.exams.courses.course_name}"`,
        new Date(record.exams.exam_datetime).toLocaleString()
      ].join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `attendance_${selectedExamData?.courses.course_code}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setSuccess('Attendance report downloaded successfully!')
  }

  const downloadExcel = () => {
    if (attendance.length === 0) {
      setError('No attendance data to download')
      return
    }

    // For Excel format, we'll create a more structured format
    const selectedExamData = exams.find(exam => exam.id.toString() === selectedExam)
    
    const headers = [
      'Student Name',
      'Matriculation Number',
      'Department',
      'Faculty',
      'Verification Status',
      'Timestamp',
      'Course Code',
      'Course Name',
      'Exam Date'
    ]

    let excelContent = `Attendance Report\n`
    excelContent += `Course: ${selectedExamData?.courses.course_code} - ${selectedExamData?.courses.course_name}\n`
    excelContent += `Exam Date: ${new Date(selectedExamData?.exam_datetime).toLocaleString()}\n`
    excelContent += `Generated: ${new Date().toLocaleString()}\n\n`
    excelContent += headers.join('\t') + '\n'
    
    attendance.forEach(record => {
      excelContent += [
        record.students.name,
        record.students.matric_number,
        record.students.department,
        record.students.faculty,
        record.verification_status,
        new Date(record.timestamp).toLocaleString(),
        record.exams.courses.course_code,
        record.exams.courses.course_name,
        new Date(record.exams.exam_datetime).toLocaleString()
      ].join('\t') + '\n'
    })

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `attendance_${selectedExamData?.courses.course_code}_${new Date().toISOString().split('T')[0]}.xls`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setSuccess('Attendance report downloaded successfully!')
  }

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    return status === 'Verified' 
      ? <Badge className="bg-green-100 text-green-800">Verified</Badge>
      : <Badge variant="destructive">Failed</Badge>
  }

  const getAttendanceStats = () => {
    const verified = attendance.filter(record => record.verification_status === 'Verified').length
    const failed = attendance.filter(record => record.verification_status === 'Failed').length
    const total = attendance.length

    return { verified, failed, total }
  }

  const stats = getAttendanceStats()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Attendance Management</h1>
        <p className="text-muted-foreground">
          View and download attendance reports for examinations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Exam</CardTitle>
          <CardDescription>
            Choose an exam to view its attendance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id.toString()}>
                      {exam.courses.course_code} - {formatDateTime(exam.exam_datetime)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={downloadCSV} 
                disabled={!selectedExam || attendance.length === 0}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
              <Button 
                onClick={downloadExcel} 
                disabled={!selectedExam || attendance.length === 0}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {selectedExam && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>
              Verification attempts for the selected exam
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : attendance.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">No attendance records</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No students have attempted verification for this exam yet.
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Matric Number</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.students.name}
                        </TableCell>
                        <TableCell>{record.students.matric_number}</TableCell>
                        <TableCell>{record.students.department}</TableCell>
                        <TableCell>
                          {getStatusBadge(record.verification_status)}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(record.timestamp)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

