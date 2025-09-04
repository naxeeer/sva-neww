import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, Upload, Trash2, Edit } from 'lucide-react'

export default function StudentRegistration() {
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingStudent, setEditingStudent] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    matric_number: '',
    class: '',
    department: 'Computer Engineering',
    faculty: 'Engineering',
    photo_url: '',
    fingerprint_template: '',
    selectedCourses: []
  })

  useEffect(() => {
    fetchStudents()
    fetchCourses()
  }, [])

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          student_courses (
            course_id,
            courses (
              course_code,
              course_name
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      setError('Error fetching students: ' + error.message)
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
      let studentData = {
        name: formData.name,
        matric_number: formData.matric_number,
        class: formData.class,
        department: formData.department,
        faculty: formData.faculty,
        photo_url: formData.photo_url,
        fingerprint_template: formData.fingerprint_template
      }

      let studentId
      if (editingStudent) {
        // Update existing student
        const { data, error } = await supabase
          .from('students')
          .update(studentData)
          .eq('id', editingStudent.id)
          .select()

        if (error) throw error
        studentId = editingStudent.id

        // Delete existing course associations
        await supabase
          .from('student_courses')
          .delete()
          .eq('student_id', studentId)
      } else {
        // Create new student
        const { data, error } = await supabase
          .from('students')
          .insert(studentData)
          .select()

        if (error) throw error
        studentId = data[0].id
      }

      // Insert course associations
      if (formData.selectedCourses.length > 0) {
        const courseAssociations = formData.selectedCourses.map(courseId => ({
          student_id: studentId,
          course_id: courseId
        }))

        const { error: courseError } = await supabase
          .from('student_courses')
          .insert(courseAssociations)

        if (courseError) throw courseError
      }

      setSuccess(editingStudent ? 'Student updated successfully!' : 'Student registered successfully!')
      resetForm()
      fetchStudents()
    } catch (error) {
      setError('Error saving student: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (student) => {
    setEditingStudent(student)
    setFormData({
      name: student.name,
      matric_number: student.matric_number,
      class: student.class || '',
      department: student.department,
      faculty: student.faculty,
      photo_url: student.photo_url || '',
      fingerprint_template: student.fingerprint_template || '',
      selectedCourses: student.student_courses?.map(sc => sc.course_id) || []
    })
  }

  const handleDelete = async (studentId) => {
    if (!confirm('Are you sure you want to delete this student?')) return

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)

      if (error) throw error
      setSuccess('Student deleted successfully!')
      fetchStudents()
    } catch (error) {
      setError('Error deleting student: ' + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      matric_number: '',
      class: '',
      department: 'Computer Engineering',
      faculty: 'Engineering',
      photo_url: '',
      fingerprint_template: '',
      selectedCourses: []
    })
    setEditingStudent(null)
  }

  const handleCourseSelection = (courseId, checked) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        selectedCourses: [...prev.selectedCourses, courseId]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        selectedCourses: prev.selectedCourses.filter(id => id !== courseId)
      }))
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Student Registration</h1>
        <p className="text-muted-foreground">
          Register new students and manage existing records
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {editingStudent ? 'Edit Student' : 'Register New Student'}
            </CardTitle>
            <CardDescription>
              {editingStudent ? 'Update student information' : 'Add a new student to the system'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="matric_number">Matriculation Number</Label>
                  <Input
                    id="matric_number"
                    value={formData.matric_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, matric_number: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class">Class/Level</Label>
                  <Input
                    id="class"
                    value={formData.class}
                    onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computer Engineering">Computer Engineering</SelectItem>
                      <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                      <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                      <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="faculty">Faculty</Label>
                <Select
                  value={formData.faculty}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, faculty: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="Arts">Arts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo_url">Student Photo URL</Label>
                <Input
                  id="photo_url"
                  type="url"
                  value={formData.photo_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, photo_url: e.target.value }))}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label>Registered Courses</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {courses.map((course) => (
                    <div key={course.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`course-${course.id}`}
                        checked={formData.selectedCourses.includes(course.id)}
                        onCheckedChange={(checked) => handleCourseSelection(course.id, checked)}
                      />
                      <Label htmlFor={`course-${course.id}`} className="text-sm">
                        {course.course_code}
                      </Label>
                    </div>
                  ))}
                </div>
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
                  {editingStudent ? 'Update Student' : 'Register Student'}
                </Button>
                {editingStudent && (
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
            <CardTitle>Registered Students</CardTitle>
            <CardDescription>
              List of all registered students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Matric No.</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.matric_number}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {student.student_courses?.map((sc) => (
                            <Badge key={sc.course_id} variant="secondary" className="text-xs">
                              {sc.courses.course_code}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(student)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(student.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

