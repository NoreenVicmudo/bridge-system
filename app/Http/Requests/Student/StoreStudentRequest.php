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
            // Core identity
            'student_number' => ['required', 'string'],

            // Profile data (nullable because they may already exist)
            'first_name'     => ['nullable', 'string', 'max:50'],
            'last_name'      => ['nullable', 'string', 'max:50'],
            'middle_name'    => ['nullable', 'string', 'max:50'],
            'suffix'         => ['nullable', 'string', 'max:10'],
            'birthdate'      => ['nullable', 'date'],
            'sex'            => ['nullable', 'string'],
            'socioeconomic_status' => ['nullable', 'string'],
            'living_arrangement'   => ['nullable', 'integer'],
            'house_no'       => ['nullable', 'string'],
            'street'         => ['nullable', 'string'],
            'barangay'       => ['nullable', 'string'],
            'city'           => ['nullable', 'string'],
            'province'       => ['nullable', 'string'],
            'postal_code'    => ['nullable', 'string'],
            'work_status'    => ['nullable', 'string'],
            'scholarship'    => ['nullable', 'string'],
            'language'       => ['nullable', 'integer'],
            'last_school_type' => ['nullable', 'string'],

            // Mode
            'mode' => ['required', 'in:section,batch,masterlist'],

            // Section context
            'academic_year'  => ['nullable', 'string'],
            'semester'       => ['nullable', 'string'],
            'section'        => ['nullable', 'string'],
            'year_level'     => ['nullable', 'integer'],
            'college'        => ['nullable', 'integer'],
            'program'        => ['nullable', 'integer'],

            // Batch context
            'batch_college'  => ['nullable', 'integer'],
            'batch_program'  => ['nullable', 'integer'],
            'batch_year'     => ['nullable', 'integer'],
            'batch_number'   => ['nullable', 'integer'],
        ];
    }
}