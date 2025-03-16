import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "./firebase";
import { TopicNote } from "@/components/ui/sticky-notes-container";

// Function to get notes for a specific topic
export const getTopicNotes = async (userId: string, courseId: string, topicId: string) => {
  try {
    const notesRef = collection(db, 'users', userId, 'notes');
    const q = query(
      notesRef,
      where('courseId', '==', courseId),
      where('topicId', '==', topicId)
    );

    const querySnapshot = await getDocs(q);
    const notes: TopicNote[] = [];

    querySnapshot.forEach((document) => {
      const data = document.data();
      notes.push({
        id: document.id,
        content: data.content,
        createdAt: data.createdAt.toDate(),
        clientId: data.clientId
      });
    });

    return notes;
  } catch (error) {
    console.error('Error fetching notes from Firebase:', error);
    return [];
  }
};

// Function to save a new note
export const saveNote = async (userId: string, courseId: string, topicId: string, note: TopicNote) => {
  try {
    const notesRef = collection(db, 'users', userId, 'notes');
    const docRef = await addDoc(notesRef, {
      courseId,
      topicId,
      content: note.content,
      createdAt: note.createdAt,
      clientId: note.id
    });
    
    return { success: true, firebaseId: docRef.id };
  } catch (error) {
    console.error('Error saving note to Firebase:', error);
    return { success: false, firebaseId: null };
  }
};

// Function to update an existing note
export const updateNote = async (userId: string, noteId: string, content: string) => {
  try {
    const noteRef = doc(db, 'users', userId, 'notes', noteId);
    await updateDoc(noteRef, {
      content,
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error updating note in Firebase:', error);
    return false;
  }
};

// Function to delete a note
export const deleteNote = async (userId: string, noteId: string) => {
  try {
    const noteRef = doc(db, 'users', userId, 'notes', noteId);
    await deleteDoc(noteRef);
    return true;
  } catch (error) {
    console.error('Error deleting note from Firebase:', error);
    return false;
  }
}; 