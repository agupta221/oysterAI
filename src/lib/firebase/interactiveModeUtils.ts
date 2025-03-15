import { db } from './firebase'
import { collection, doc, getDoc, setDoc } from 'firebase/firestore'
import type { InteractiveModeContent } from '@/lib/interactive-mode-generator'

interface InteractiveModeData {
  mode: 'scenario-based' | 'timeline'
  content: InteractiveModeContent
  createdAt: number
}

export async function getInteractiveModeData(
  userId: string,
  courseId: string,
  topicId: string,
  questionId: string
): Promise<InteractiveModeData | null> {
  try {
    const docRef = doc(
      db,
      'users',
      userId,
      'courses',
      courseId,
      'topics',
      topicId,
      'interactiveModes',
      questionId
    )
    
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return docSnap.data() as InteractiveModeData
    }
    
    return null
  } catch (error) {
    console.error('Error fetching interactive mode data:', error)
    return null
  }
}

export async function saveInteractiveModeData(
  userId: string,
  courseId: string,
  topicId: string,
  questionId: string,
  data: InteractiveModeData
): Promise<void> {
  try {
    const docRef = doc(
      db,
      'users',
      userId,
      'courses',
      courseId,
      'topics',
      topicId,
      'interactiveModes',
      questionId
    )
    
    await setDoc(docRef, {
      ...data,
      createdAt: Date.now()
    })
    
    console.log('Interactive mode data saved successfully')
  } catch (error) {
    console.error('Error saving interactive mode data:', error)
    throw error
  }
} 