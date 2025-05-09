import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2 class="auth-title">Create an Account</h2>

        <div *ngIf="errorMessage" class="alert alert-danger">
          {{ errorMessage }}
        </div>

        <form (ngSubmit)="register(registerForm)" #registerForm="ngForm" novalidate>
          <div class="form-group">
            <label for="displayName">Display Name<span class="required">*</span></label>
            <input 
              type="text" 
              id="displayName" 
              name="displayName"
              class="form-control" 
              [(ngModel)]="displayName" 
              required
              minlength="3"
              #displayNameInput="ngModel"
              [class.is-invalid]="displayNameInput.invalid && displayNameInput.touched"
            >
            <div *ngIf="displayNameInput.invalid && displayNameInput.touched" class="error-message">
              <p *ngIf="displayNameInput.errors?.['required']">Display name is required.</p>
              <p *ngIf="displayNameInput.errors?.['minlength']">Display name must be at least 3 characters long.</p>
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email<span class="required">*</span></label>
            <input 
              type="email" 
              id="email" 
              name="email"
              class="form-control" 
              [(ngModel)]="email" 
              required
              email
              #emailInput="ngModel"
              [class.is-invalid]="emailInput.invalid && emailInput.touched"
            >
            <div *ngIf="emailInput.invalid && emailInput.touched" class="error-message">
              <p *ngIf="emailInput.errors?.['required']">Email is required.</p>
              <p *ngIf="emailInput.errors?.['email']">Invalid email format.</p>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password<span class="required">*</span></label>
            <input 
              type="password" 
              id="password" 
              name="password"
              class="form-control" 
              [(ngModel)]="password" 
              required
              minlength="6"
              #passwordInput="ngModel"
              [class.is-invalid]="passwordInput.invalid && passwordInput.touched"
            >
            <div *ngIf="passwordInput.invalid && passwordInput.touched" class="error-message">
              <p *ngIf="passwordInput.errors?.['required']">Password is required.</p>
              <p *ngIf="passwordInput.errors?.['minlength']">Password must be at least 6 characters long.</p>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password<span class="required">*</span></label>
            <input 
              type="password" 
              id="confirmPassword" 
              name="confirmPassword"
              class="form-control" 
              [(ngModel)]="confirmPassword" 
              required
              #confirmPasswordInput="ngModel"
              [class.is-invalid]="(confirmPasswordInput.dirty || confirmPasswordInput.touched) && password !== confirmPassword"
            >
            <div *ngIf="(confirmPasswordInput.dirty || confirmPasswordInput.touched) && password !== confirmPassword" class="error-message">
              Passwords do not match.
            </div>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary btn-block" 
            [disabled]="registerForm.invalid || password !== confirmPassword || isLoading"
          >
            <span *ngIf="isLoading">Creating Account...</span>
            <span *ngIf="!isLoading">Register</span>
          </button>
        </form>

        <div class="divider">OR</div>

        <button 
          class="btn btn-google btn-block" 
          (click)="signInWithGoogle()"
          [disabled]="isLoading"
        >
          Sign up with Google
        </button>

        <div class="auth-footer">
          <p>Already have an account? <a routerLink="/login">Log In</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 200px);
      padding: 20px;
    }

    .auth-card {
      width: 100%;
      max-width: 400px;
      background-color: #FFFFFF;
      border-radius: var(--border-radius);
      box-shadow: var(--box-shadow);
      padding: 30px;
    }

    .auth-title {
      color: var(--primary-color);
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 24px;
      text-align: center;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      font-weight: 500;
      margin-bottom: 6px;
      color: var(--text-color);
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: var(--border-radius);
      font-size: 16px;
      transition: var(--transition);
    }

    .form-control:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(0, 51, 102, 0.2);
    }

    .is-invalid {
      border-color: var(--danger-color);
    }

    .error-message {
      color: var(--danger-color);
      font-size: 14px;
      margin-top: 5px;
    }

    .btn-block {
      width: 100%;
      padding: 12px;
      font-size: 16px;
      margin-top: 10px;
    }

    .btn-google {
      background-color: #4285F4;
      color: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-google:hover {
      background-color: #357ae8;
    }

    .divider {
      text-align: center;
      margin: 16px 0;
      font-size: 14px;
      color: #666;
    }

    .auth-footer {
      margin-top: 24px;
      text-align: center;
      font-size: 14px;
    }

    .auth-footer a {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 500;
    }

    .auth-footer a:hover {
      text-decoration: underline;
    }
    
    .required {
      color: var(--danger-color);
      font-weight: bold;
    }
  `]
})
export class RegisterComponent {
  displayName = '';
  email = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';
  isLoading = false;

  private authService = inject(AuthService);

  async register(form: NgForm): Promise<void> {
    if (form.invalid || this.password !== this.confirmPassword) {
      Object.keys(form.controls).forEach(key => {
        form.controls[key]?.markAsTouched();
      });
  
      if (this.password !== this.confirmPassword) {
        this.errorMessage = 'Passwords do not match.';
      } else {
        this.errorMessage = 'Please fill in all required fields.';
      }
      return;
    }
  
    this.isLoading = true;
    this.errorMessage = '';
  
    try {
      await this.authService.registerUser(this.email, this.password, this.displayName);
    } catch (error: any) {
      this.errorMessage = error.message;  
    } finally {
      this.isLoading = false;
    }
  }

  async signInWithGoogle(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.authService.signInWithGoogle();
    } catch (error) {
      console.error('Google Sign-Up error:', error);
      this.errorMessage = 'Failed to sign up with Google. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
}
