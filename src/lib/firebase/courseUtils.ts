import { auth, db, storage, checkAuthState } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  getDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import type { Course } from "@/components/ui/course-tile";

// Collection name for courses
const COURSES_COLLECTION = 'courses';

// Function to generate a storage path for course audio
const getCourseAudioPath = (userId: string, courseId: string) => {
  return `users/${userId}/courses/${courseId}/course-summary.mp3`;
};

// Upload audio file to Firebase Storage
export const uploadCourseAudio = async (audioBlob: Blob, courseId: string): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User must be logged in to upload audio');

  const audioPath = getCourseAudioPath(user.uid, courseId);
  const storageRef = ref(storage, audioPath);

  try {
    await uploadBytes(storageRef, audioBlob);
    return audioPath; // Return the storage path instead of download URL
  } catch (error) {
    console.error('Error uploading audio:', error);
    throw new Error('Failed to upload course audio');
  }
};

// Get download URL for audio file
export const getCourseAudioUrl = async (audioPath: string): Promise<string> => {
  console.log('Getting audio URL for path:', audioPath);
  try {
    const storageRef = ref(storage, audioPath);
    console.log('Storage reference created:', storageRef.fullPath);
    const url = await getDownloadURL(storageRef);
    console.log('Successfully retrieved download URL');
    return url;
  } catch (error) {
    console.error('Error getting audio URL:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw new Error('Failed to get course audio URL');
  }
};

// Delete audio file from storage
export const deleteCourseAudio = async (audioPath: string): Promise<void> => {
  try {
    const storageRef = ref(storage, audioPath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting audio:', error);
    // Don't throw here as the file might not exist
  }
};

// Type for course data stored in Firestore
export interface FirestoreCourse {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  isGenerating: boolean;
  userId: string;
  createdAt: Timestamp;
  summary?: string;
  audioPath?: string;
  syllabus?: any; // We'll keep this as 'any' since it's a complex nested structure
}

// Helper function to sanitize data for Firestore
const sanitizeForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (obj instanceof Date) {
    return Timestamp.fromDate(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item));
  }

  if (typeof obj === 'object') {
    const sanitized: { [key: string]: any } = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip functions and undefined values
      if (typeof value !== 'function' && value !== undefined) {
        sanitized[key] = sanitizeForFirestore(value);
      }
    }
    return sanitized;
  }

  return obj;
};

// Convert Course to FirestoreCourse
const courseToFirestore = (course: Course, userId: string): FirestoreCourse => {
  // First, create a basic structure with known fields
  const baseData: Partial<FirestoreCourse> = {
    id: course.id,
    title: course.title,
    description: course.description,
    imageUrl: course.imageUrl,
    isGenerating: course.isGenerating || false,
    userId,
    createdAt: Timestamp.fromDate(course.createdAt),
  };

  // Safely add optional fields
  if (course.summary) {
    baseData.summary = course.summary;
  }

  if (course.audioPath) {
    baseData.audioPath = course.audioPath;
  }

  // Sanitize the syllabus structure
  if (course.syllabus) {
    baseData.syllabus = sanitizeForFirestore(course.syllabus);
  }

  console.log('Sanitized course data:', baseData);
  return baseData as FirestoreCourse;
};

// Convert FirestoreCourse to Course
const firestoreToCourse = (firestoreDoc: FirestoreCourse): Course => {
  return {
    id: firestoreDoc.id,
    title: firestoreDoc.title,
    description: firestoreDoc.description,
    imageUrl: firestoreDoc.imageUrl,
    isGenerating: firestoreDoc.isGenerating,
    createdAt: firestoreDoc.createdAt.toDate(),
    summary: firestoreDoc.summary,
    audioPath: firestoreDoc.audioPath,
    syllabus: firestoreDoc.syllabus,
  };
};

// Add a new course
export const addCourse = async (course: Course): Promise<string> => {
  console.log('Attempting to add course to Firestore...');
  const isAuthenticated = checkAuthState();
  if (!isAuthenticated) {
    console.error('No authenticated user found');
    throw new Error('User must be logged in to add a course');
  }

  const user = auth.currentUser;
  console.log('Current user:', user?.uid);

  try {
    console.log('Converting course to Firestore format...');
    const courseData = courseToFirestore(course, user!.uid);
    console.log('Course data:', JSON.stringify(courseData, null, 2));
    
    // Create the courses collection if it doesn't exist
    const coursesRef = collection(db, COURSES_COLLECTION);
    
    console.log('Adding document to Firestore...');
    const docRef = await addDoc(coursesRef, courseData);
    console.log('Successfully added course with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error in addCourse:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
};

// Get all courses for the current user
export const getUserCourses = async (): Promise<Course[]> => {
  console.log('Attempting to get user courses...');
  const isAuthenticated = checkAuthState();
  if (!isAuthenticated) {
    console.error('No authenticated user found');
    throw new Error('User must be logged in to get courses');
  }

  const user = auth.currentUser;
  console.log('Current user:', user?.uid);

  try {
    // Create the courses collection reference
    const coursesRef = collection(db, COURSES_COLLECTION);
    
    console.log('Creating Firestore query...');
    let coursesQuery;
    try {
      // Try with ordering first
      coursesQuery = query(
        coursesRef,
        where('userId', '==', user!.uid),
        orderBy('createdAt', 'desc')
      );
      console.log('Executing ordered Firestore query...');
      const querySnapshot = await getDocs(coursesQuery);
      console.log('Query results:', querySnapshot.docs.length, 'courses found');
      
      const courses = querySnapshot.docs.map(doc => {
        const data = { ...doc.data(), id: doc.id } as FirestoreCourse;
        console.log('Raw Firestore course data:', data);
        const course = firestoreToCourse(data);
        console.log('Converted course data:', course);
        return course;
      });

      return courses;
    } catch (error) {
      if (error instanceof Error && error.message.includes('requires an index')) {
        console.log('Index not ready yet, falling back to unordered query');
        // Fallback to simple query without ordering
        coursesQuery = query(
          coursesRef,
          where('userId', '==', user!.uid)
        );
        const fallbackSnapshot = await getDocs(coursesQuery);
        console.log('Fallback query results:', fallbackSnapshot.docs.length, 'courses found');
        
        // Sort the results in memory
        const courses = fallbackSnapshot.docs.map(doc => {
          const data = { ...doc.data(), id: doc.id } as FirestoreCourse;
          console.log('Raw Firestore course data:', data);
          const course = firestoreToCourse(data);
          console.log('Converted course data:', course);
          return course;
        });
        
        return courses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in getUserCourses:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
};

// Update a course
export const updateCourse = async (courseId: string, updates: Partial<Course>): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User must be logged in to update a course');

  const courseRef = doc(db, COURSES_COLLECTION, courseId);
  await updateDoc(courseRef, updates);
};

// Delete a course
export const deleteCourse = async (courseId: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User must be logged in to delete a course');

  try {
    // Get the course data first to get the audio path
    const courseRef = doc(db, COURSES_COLLECTION, courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      throw new Error('Course not found');
    }

    const courseData = courseDoc.data();
    
    // Check if this course belongs to the current user
    if (courseData.userId !== user.uid) {
      throw new Error('Unauthorized to delete this course');
    }

    // Delete the audio file if it exists
    if (courseData.audioPath) {
      await deleteCourseAudio(courseData.audioPath);
    }

    // Delete the course document from Firestore
    await deleteDoc(courseRef);
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
}; 