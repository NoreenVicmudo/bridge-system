<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // We handle authorization in middleware/controller
    }

    public function rules(): array
    {
        return [
            // Core Identity
            'student_number' => ['required', 'string'],
            
            // Profile Data (Nullable in case they already exist)
            'first_name' => ['nullable', 'string', 'max:50'],
            'last_name' => ['nullable', 'string', 'max:50'],
            'middle_name' => ['nullable', 'string', 'max:50'],
            'suffix' => ['nullable', 'string', 'max:10'],
            'birthdate' => ['nullable', 'date'],
            'sex' => ['nullable', 'string'],
            'socioeconomic_status' => ['nullable', 'string'],
            'living_arrangement' => ['nullable', 'integer'],
            'house_no' => ['nullable', 'string'],
            'street' => ['nullable', 'string'],
            'barangay' => ['nullable', 'string'],
            'city' => ['nullable', 'string'],
            'province' => ['nullable', 'string'],
            'postal_code' => ['nullable', 'string'],
            'work_status' => ['nullable', 'string'],
            'scholarship' => ['nullable', 'string'],
            'language' => ['nullable', 'integer'],
            'last_school_type' => ['nullable', 'string'],

            // The "Context" Fields (Required to enroll them!)
            'college' => ['required', 'integer'],
            'program' => ['required', 'integer'],
            'academic_year' => ['required', 'string'],
            'semester' => ['required', 'string'],
            'year_level' => ['required', 'integer'],
            'section' => ['required', 'string'],
        ];
    }
}