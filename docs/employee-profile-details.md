# Detailed employee profiles

Apply Supabase migration `0030_employee_profile_details.sql` before deploying this application version. It adds 26 nullable columns to `profiles`; existing rows need no backfill. Full Name, Designation, and Department reuse `full_name`, `role_title`, and `department_id` respectively.

Detailed views, admin updates, and employee updates use Overview, Joining, Address & Contacts, Personal Details, and Profile tabs. Academic history, summary, experience, projects, and certifications appear under Profile. The existing work email remains distinct from the new company/personal/preferred email fields; employee updates cannot change the account work email.

This application exposes profile GET/update operations through Next.js server actions, rather than REST profile routes. `getEmployeeDetailsAction` and profile pages use `getEmployeeById`, which returns every detailed field. `updateEmployeeAction` and approved employee proposals use `UpdateEmployeeInput`. Omitted detailed properties leave stored values unchanged, while null or blank values clear them. Dates use YYYY-MM-DD, and notice days must be a non-negative integer. Employee proposals still require review, including full name changes and all new details.

`CreateEmployeeInput`, creation inserts, onboarding, and employee/admin creation scenarios retain their existing behavior. New details are never required by creation. No new HR fields are added to generated CV exports.

Run `node --test tests/employee-details.test.cjs` for regression checks of legacy records, detailed reads/writes, clearing/validation, and employee/admin creation behavior. The tests use a database stub; applying the migration and testing against a live Supabase instance are separate deployment steps.
