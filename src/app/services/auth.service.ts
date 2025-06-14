import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  User as FirebaseUser,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  browserLocalPersistence, 
  setPersistence
} from 'firebase/auth';
import { hash } from 'bcryptjs'; 
import { Observable, BehaviorSubject, of, ReplaySubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = getAuth();
  private db = getFirestore();
  private userSubject = new BehaviorSubject<User | null>(null);
  private router = inject(Router);

  user$: Observable<User | null> = this.userSubject.asObservable();
  isAuthenticated$: Observable<boolean> = this.user$.pipe(
    switchMap(user => of(!!user))
  );
  private authReadySubject = new ReplaySubject<boolean>(1);
  authReady$ = this.authReadySubject.asObservable();

  private userUnsubscribe: (() => void) | null = null;

  constructor() {
    setPersistence(this.auth, browserLocalPersistence)
      .then(() => {
        this.initAuthListener();
      })
      .catch((error) => {
        console.error('Error setting auth persistence:', error);
        this.initAuthListener();
      });
  }

  private initAuthListener(): void {
    onAuthStateChanged(this.auth, (firebaseUser) => {
      if (firebaseUser) {
        if (this.userUnsubscribe) this.userUnsubscribe();

        const userRef = doc(this.db, 'users', firebaseUser.uid);
        this.userUnsubscribe = onSnapshot(userRef, (userSnap) => {
          if (userSnap.exists()) {
            const userData = userSnap.data() as User;
            this.userSubject.next(userData);
            this.authReadySubject.next(true);
          } else {
            this.userSubject.next(null);
            this.authReadySubject.next(true);
          }
        }, (error) => {
          console.error('Error listening to user doc:', error);
          this.userSubject.next(null);
          this.authReadySubject.next(true);
        });
      } else {
        if (this.userUnsubscribe) this.userUnsubscribe();
        this.userSubject.next(null);
        this.authReadySubject.next(true);
      }
    });
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
      console.log('Password reset email sent successfully');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  private async getUserData(uid: string): Promise<User | null> {
    try {
      const userRef = doc(this.db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data() as User;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  async registerUser(email: string, password: string, displayName: string): Promise<void> {
    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = credential.user;
  
      await updateProfile(user, { displayName });
  
      const hashedPassword = await hash(password, 10);
  
      const userData: User = {
        uid: user.uid,
        email: user.email!,
        displayName: displayName,
        photoURL: user.photoURL || '',
        createdAt: new Date(),
        password: hashedPassword, 
      };
  
      await setDoc(doc(this.db, 'users', user.uid), userData);
  
      this.userSubject.next(userData);
      this.router.navigate(['/']);
    } catch (error: any) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          throw new Error('This email is already registered. Please log in.');
        case 'auth/weak-password':
          throw new Error('Password must be at least 6 characters long.');
        case 'auth/invalid-email':
          throw new Error('Invalid email format.');
        default:
          console.error('Registration error:', error);
          throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  }

  async login(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);

      const user = this.auth.currentUser;
      if (user) {
        const userRef = doc(this.db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data() as User;
          if (userData.banned) {
            await signOut(this.auth);
            throw new Error('You are banned. Contact support.');
          }
        }
      }

      this.router.navigate(['/']);
    } catch (error: any) {
      switch (error.code) {
        case 'auth/invalid-credential':
          throw new Error('Invalid credentials. Please check your email and password.');
        case 'auth/invalid-email':
          throw new Error('Invalid email format.');
        default:
          throw new Error(error.message || 'An unexpected error occurred. Please try again.');
      }
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.userSubject.next(null);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async signInWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;

      const userRef = doc(this.db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        if (userData.banned) {
          await signOut(this.auth);
          throw new Error('You are banned. Contact support.');
        }
      } else {
        const userData: User = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          createdAt: new Date()
        };
        await setDoc(userRef, userData);
      }

      this.router.navigate(['/']);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in with Google. Please try again.');
    }
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }
}