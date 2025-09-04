import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar, Trash2, Edit } from 'lucide-react'

export default function ExamScheduling() {
  const [exams, setExams] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingExam, setEditingExam] = useState(null)

  const [formData, setFormData] = useState({
    course_id: '',
    exam_datetime: '',
  })

  useEffect(() => {
    fetchExams()
    fetchCourses()
  }, [])

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select(`
          *,
          courses (
            course_code,
            course_name,
            department
          )
        `)
        .order('exam_datetime', { ascending: true })

      if (error) throw error
      setExams(data || [])
    } catch (error) {
      setError('Error fetching exams: ' + error.message)
    }
  }

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('course_code')

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      setError('Error fetching courses: ' + error.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      const examData = {
        course_id: parseInt(formData.course_id),
        exam_datetime: formData.exam_datetime,
        created_by: user?.id
      }

      if (editingExam) {
        // Update existing exam
        const { error } = await supabase
          .from('exams')
          .update(examData)
          .eq('id', editingExam.id)

        if (error) throw error
        setSuccess('Exam updated successfully!')
      } else {
        // Create new exam
        const { error } = await supabase
          .from('exams')
          .insert(examData)

        if (error) throw error
        setSuccess('Exam scheduled successfully!')
      }

      resetForm()
      fetchExams()
    } catch (error) {
      setError('Error saving exam: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (exam) => {
    setEditingExam(exam)
    setFormData({
      course_id: exam.course_id.toString(),
      exam_datetime: new Date(exam.exam_datetime).toISOString().slice(0, 16)
    })
  }

  const handleDelete = async (examId) => {
    if (!confirm('Are you sure you want to delete this exam?')) return

    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId)

      if (error) throw error
      setSuccess('Exam deleted successfully!')
      fetchExams()
    } catch (error) {
      setError('Error deleting exam: ' + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      course_id: '',
      exam_datetime: ''
    })
    setEditingExam(null)
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

  const getExamStatus = (examDateTime) => {
    const now = new Date()
    const examDate = new Date(examDateTime)
    
    if (examDate < now) {
      return { status: 'Completed', variant: 'secondary' }
    } else if (examDate.toDateString() === now.toDateString()) {
      return { status: 'Today', variant: 'default' }
    } else {
      return { status: 'Upcoming', variant: 'outline' }
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Exam Scheduling</h1>
        <p className="text-muted-foreground">
          Schedule and manage examination sessions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {editingExam ? 'Edit Exam' : 'Schedule New Exam'}
            </CardTitle>
            <CardDescription>
              {editingExam ? 'Update exam details' : 'Create a new examination session'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Select
                  value={formData.course_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.course_code} - {course.course_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exam_datetime">Exam Date & Time</Label>
                <Input
                  id="exam_datetime"
                  type="datetime-local"
                  value={formData.exam_datetime}
                  onChange={(e) => setFormData(prev => ({ ...prev, exam_datetime: e.target.value }))}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Calendar className="mr-2 h-4 w-4" />
                  {editingExam ? 'Update Exam' : 'Schedule Exam'}
                </Button>
                {editingExam && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scheduled Exams</CardTitle>
            <CardDescription>
              List of all scheduled examinations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam) => {
                    const { status, variant } = getExamStatus(exam.exam_datetime)
                    return (
                      <TableRow key={exam.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{exam.courses.course_code}</div>
                            <div className="text-sm text-muted-foreground">
                              {exam.courses.course_name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDateTime(exam.exam_datetime)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={variant}>{status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(exam)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(exam.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {courses.length === 0 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No courses available</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You need to add courses before scheduling exams.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

