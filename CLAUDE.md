# CLAUDE.md - Imedto Project Guide

## Project Overview

**Imedto** is a healthcare appointment management system built with Vue 3, TypeScript, and Supabase. The application allows healthcare professionals to manage appointments, patients, establishments, and their professional profiles.

### Tech Stack

- **Frontend Framework**: Vue 3.5+ (Composition API with `<script setup>`)
- **Language**: TypeScript 5.5+
- **Build Tool**: Vite 5.4+
- **State Management**: Pinia 2.2+
- **Routing**: Vue Router 4.4+
- **Styling**: Tailwind CSS 3.4+
- **UI Components**: Naive UI 2.40+
- **Backend/Database**: Supabase (PostgreSQL + Authentication)
- **Icons**: Font Awesome
- **Code Quality**: ESLint + Prettier

### Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Type-check and build for production
npm run preview      # Preview production build
npm run type-check   # Run TypeScript type checking
npm run lint         # Run ESLint with auto-fix
npm run format       # Format code with Prettier
```

## Architecture & Project Structure

### Directory Structure

```
src/
├── assets/              # Static assets (CSS, images)
│   ├── css/            # Global styles (main.css with Tailwind)
│   └── images/         # Image assets
├── lib/                # External library configurations
│   └── supabaseClient.ts  # Supabase client setup
├── modules/            # Feature modules (primary organization pattern)
│   ├── agendamento/    # Appointment management
│   │   ├── components/ # Module-specific components
│   │   └── views/      # Module views/pages
│   ├── auth/           # User registration
│   ├── estabelecimento/# Establishment management
│   ├── home/           # Dashboard/home
│   ├── login/          # Login functionality
│   ├── onboarding/     # User onboarding flow
│   ├── pacientes/      # Patient management
│   ├── perfil/         # User profile
│   ├── profissionais/  # Professional management
│   └── shared/         # Shared components and structures
│       ├── components/ # Reusable components (Sidebar, etc.)
│       └── structure/  # Layout components (PageBody)
├── router/             # Vue Router configuration
│   └── index.ts        # Route definitions and guards
├── stores/             # Pinia state management stores
│   ├── auth.ts         # Authentication state
│   ├── userContext.ts  # User context and establishment data
│   ├── agendamento.ts  # Appointment state
│   ├── onboarding.ts   # Onboarding flow state
│   ├── pacientes.ts    # Patient state
│   ├── progresso.ts    # Progress tracking
│   └── notificacoes.ts # Notification state
├── utils/              # Utility functions
│   └── naive_ui_theme.ts  # Naive UI theme configuration
├── App.vue             # Root component
└── main.ts             # Application entry point
```

### Module-Based Architecture

The codebase follows a **feature-based modular architecture**:

- Each feature is organized under `src/modules/{feature-name}/`
- Modules contain their own `views/` (pages) and `components/` (feature-specific components)
- This structure promotes:
  - **Feature isolation**: Related code stays together
  - **Scalability**: Easy to add new features
  - **Maintainability**: Clear boundaries between features

## Key Conventions & Patterns

### 1. Vue Component Structure

All components use Vue 3 Composition API with `<script setup>`:

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStore } from '@/stores/storeName'

// Props
interface Props {
  propName: string
}
const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  eventName: [payload: string]
}>()

// State
const localState = ref('')

// Computed
const computedValue = computed(() => {
  // computation
})

// Methods
function handleAction() {
  // logic
}

// Lifecycle
onMounted(() => {
  // initialization
})
</script>

<template>
  <!-- Template -->
</template>
```

### 2. State Management with Pinia

Stores follow this pattern:

```typescript
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useStoreName = defineStore('store-name', () => {
  // State (using ref)
  const state = ref<Type>(initialValue)

  // Computed values
  const computed = computed(() => {
    // computation
  })

  // Actions (async functions for data operations)
  async function action() {
    // logic
  }

  return {
    // Expose state, computed, and actions
    state,
    computed,
    action,
  }
})
```

**Important Store Patterns**:
- Use `ref()` for reactive state
- Use `computed()` for derived state
- Actions handle async operations and mutations
- Stores can import and use other stores

### 3. Routing & Navigation Guards

The application uses two main route guards:

**`ifNotAuthenticated`**: Prevents authenticated users from accessing login/register pages
```typescript
// Redirects to home if already authenticated
// Used for: /login, /register
```

**`ifAuthenticated`**: Requires authentication and checks onboarding status
```typescript
// Redirects to /login if not authenticated
// Redirects to /onboarding if onboarding not completed
// Used for: All authenticated routes (home, perfil, etc.)
```

**Route Structure**:
- Public routes: `/login`, `/register`
- Onboarding: `/onboarding` (protected, but allows incomplete onboarding)
- Main app: `/` with nested child routes (all protected)
  - Child routes use `PageBody` layout component with Sidebar

### 4. Supabase Integration

**Client Setup** (`src/lib/supabaseClient.ts`):
```typescript
import { createClient } from '@supabase/supabase-js'

const projectUrl = import.meta.env.VITE_SUPABASE_PROJECT
const apiKey = import.meta.env.VITE_SUPABASE_APIKEY

export const supabase = createClient(projectUrl, apiKey)
```

**Common Patterns**:
```typescript
// Query with join
const { data, error } = await supabase
  .from('table_name')
  .select(`
    *,
    related_table (
      column1,
      column2
    )
  `)
  .eq('column', value)
  .single() // or .maybeSingle() if record might not exist

// Insert
const { data, error } = await supabase
  .from('table_name')
  .insert({ ...data })
  .select()
  .single()

// Update
const { error } = await supabase
  .from('table_name')
  .update({ field: value })
  .eq('id', id)

// Authentication
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})
```

### 5. TypeScript Conventions

- **Interfaces for Props**: Define component props using interfaces
- **Type imports**: Use `import type { Type } from '@supabase/supabase-js'` for types
- **Strict mode**: Enabled in `tsconfig.json`
- **Path aliases**: Use `@/` for `src/` directory
- **ESLint rules**:
  - `@typescript-eslint/no-explicit-any: warn` (avoid `any` when possible)
  - Multi-word component names not enforced

### 6. Styling Conventions

**Tailwind CSS**:
- Primary color palette:
  - `primary`: #452B97 (main purple)
  - `primary-light`: #EFEFFF
  - `primary-medium`: #ABABE2
  - `primary-dark`: #241554
- Gray scale: `gray-300`, `gray-600`, `gray-800`
- Font: Nunito (sans-serif)

**Usage**:
- Use Tailwind utility classes for most styling
- Global styles in `src/assets/css/main.css`
- Naive UI components provide pre-styled elements

## Database Schema Overview

Key tables (from `Estrutura inicial do Supabase.txt`):

### Core Tables
- **profissionais**: Healthcare professionals (doctors, nurses, etc.)
- **pacientes**: Patients
- **estabelecimentos**: Healthcare establishments/clinics
- **profissoes**: Professional roles/types
- **especialidades**: Medical specialties
- **agenda_eventos**: Appointment events/schedule

### Relationship Tables
- **vinculo_profissional_estabelecimento**: Links professionals to establishments
  - Includes `is_admin` flag for administrative privileges
  - `ativo` flag for active/inactive status

### Important Enums
- **status_evento**: `agendado`, `confirmado`, `realizado`, `cancelado`, `faltou`
- **tipo_evento**: `consulta`, `cirurgia`, `exame`, `retorno`
- **app_role**: `admin`, `medico`, `secretaria`, `financeiro`, `profissional`

## Authentication & Authorization Flow

### 1. Authentication Process

**Login Flow** (src/stores/auth.ts:30):
1. User provides email/password
2. `supabase.auth.signInWithPassword()` validates credentials
3. On success:
   - Set `isAuthenticated = true`
   - Store session in `sessionStorage` (via `useStorage` from VueUse)
   - Store user data: `id`, `email`, `access_token`, `expires_at`
   - Navigate to home (`/`)

**Logout Flow** (src/stores/auth.ts:59):
1. Call `supabase.auth.signOut()`
2. Clear user session
3. Redirect to `/login`

### 2. User Context & Multi-Tenancy

**Context Loading** (src/stores/userContext.ts:65):
1. Fetch professional data with joined `profissoes` table
2. Fetch establishment links (`vinculo_profissional_estabelecimento`)
3. Set current establishment (first active one by default)
4. Determine admin status based on current establishment link

**Key Features**:
- Users can belong to multiple establishments
- Each user-establishment link has an `is_admin` flag
- Context switches when user changes active establishment
- `isAdmin` computed property determines access level

### 3. Onboarding Guard

**Logic** (src/router/index.ts:44):
- After login, check if professional record exists
- Check `onboarding_completo` flag
- Redirect to `/onboarding` if incomplete
- Block access to main app until onboarding complete
- Prevent accessing `/onboarding` if already completed

## Development Workflows

### Adding a New Feature Module

1. **Create module directory**:
   ```bash
   mkdir -p src/modules/{module-name}/{views,components}
   ```

2. **Create view component**:
   ```bash
   # src/modules/{module-name}/views/ModuleName.vue
   ```

3. **Add route**:
   ```typescript
   // src/router/index.ts
   const ModuleName = () => import('@/modules/{module-name}/views/ModuleName.vue')

   // Add to children of PageBody route
   { path: 'module-name', name: 'module-name', component: ModuleName }
   ```

4. **Create store (if needed)**:
   ```typescript
   // src/stores/moduleName.ts
   export const useModuleNameStore = defineStore('module-name', () => {
     // Store implementation
   })
   ```

5. **Add to sidebar navigation** (if needed):
   ```typescript
   // src/modules/shared/components/Sidebar.vue
   ```

### Working with Supabase

1. **Environment Variables**:
   Create `.env` file (not committed):
   ```env
   VITE_SUPABASE_PROJECT=your_supabase_url
   VITE_SUPABASE_APIKEY=your_supabase_anon_key
   ```

2. **Database Changes**:
   - Schema is defined in `Estrutura inicial do Supabase.txt`
   - Changes should be made in Supabase dashboard or via migrations
   - Update TypeScript interfaces to match database schema

3. **Row Level Security (RLS)**:
   - Ensure RLS policies are set up in Supabase
   - Queries automatically filtered by user context
   - Use `auth.uid()` in policies for user-specific data

### Code Quality

**Before Committing**:
```bash
npm run lint      # Fix linting issues
npm run format    # Format code
npm run type-check # Check TypeScript errors
```

**ESLint Configuration** (eslint.config.js):
- Vue 3 essential rules
- TypeScript recommended rules
- Prettier integration (skip formatting)
- Custom rules:
  - Unused vars: warning
  - Multi-word component names: disabled
  - Explicit any: warning

## Common Patterns & Best Practices

### 1. Data Fetching Pattern

```typescript
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useStore } from '@/stores/storeName'

const store = useStore()
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    loading.value = true
    await store.fetchData()
  } catch (err) {
    error.value = err.message
    console.error('Error loading data:', err)
  } finally {
    loading.value = false
  }
})
</script>
```

### 2. Form Handling

```typescript
<script setup lang="ts">
import { reactive } from 'vue'

interface FormData {
  field1: string
  field2: number
}

const formData = reactive<FormData>({
  field1: '',
  field2: 0,
})

async function handleSubmit() {
  try {
    // Validation
    if (!formData.field1) {
      throw new Error('Field is required')
    }

    // Submit to store or API
    await store.submitData(formData)

    // Success handling
    router.push('/success')
  } catch (error) {
    console.error('Submit error:', error)
  }
}
</script>
```

### 3. Computed Properties for Status Display

```typescript
// Example from src/modules/agendamento/views/Agendamento.vue:30
function getStatusColor(status: string) {
  const cores: Record<string, string> = {
    agendado: 'bg-blue-100 text-blue-800',
    confirmado: 'bg-green-100 text-green-800',
    realizado: 'bg-gray-100 text-gray-800',
    cancelado: 'bg-red-100 text-red-800',
  }
  return cores[status] || 'bg-gray-100 text-gray-800'
}
```

### 4. Lazy Loading Routes

- Main routes: Imported directly (Login, Register, Home, Onboarding, PageBody)
- Secondary routes: Lazy loaded with `() => import()`
- Benefits: Smaller initial bundle, faster first load

### 5. Using Composables (VueUse)

```typescript
import { useStorage } from '@vueuse/core'

// Automatically syncs with sessionStorage
const currentUser = useStorage(
  'currentUser',
  {} as Partial<Session>,
  sessionStorage,
)
```

## Troubleshooting & Common Issues

### Authentication Issues

**Session not persisting**:
- Check `sessionStorage` in browser DevTools
- Verify Supabase URL and API key in `.env`
- Ensure `auth.initialize()` is called in `main.ts` before router

**Redirect loops**:
- Check route guard logic in `src/router/index.ts`
- Verify `onboarding_completo` flag in database
- Clear session storage and try fresh login

### TypeScript Errors

**Cannot find module '@/...'**:
- Check `tsconfig.json` paths configuration
- Ensure `baseUrl` is set to `"."`
- Verify file exists at specified path

**Type errors in Vue components**:
- Install Volar extension in VSCode
- Disable Vetur if installed (conflicts with Volar)
- Run `npm run type-check` for detailed errors

### Supabase Query Issues

**No rows returned unexpectedly**:
- Check RLS policies in Supabase dashboard
- Verify user is authenticated
- Use `.maybeSingle()` if record might not exist
- Check filter conditions (`.eq()`, `.filter()`)

**Type mismatches**:
- Ensure TypeScript interfaces match database schema
- Update interfaces when schema changes
- Use Supabase type generation if needed

## AI Assistant Guidelines

### When Making Changes

1. **Read before modifying**: Always read existing files before editing
2. **Follow existing patterns**: Match the coding style in the file
3. **Check related files**: Look at router, stores, and related components
4. **Update types**: Keep TypeScript interfaces in sync with changes
5. **Test route guards**: Consider authentication and onboarding flows
6. **Maintain module structure**: Keep feature code within its module

### Common Tasks

**Adding a new page**:
1. Create view in appropriate module
2. Add route in `src/router/index.ts`
3. Create/update store if needed
4. Add navigation link in Sidebar (if needed)

**Adding a new form**:
1. Define TypeScript interface for form data
2. Use `reactive()` for form state
3. Add validation before submission
4. Handle errors with try/catch
5. Use Naive UI form components

**Querying Supabase**:
1. Always handle errors
2. Use proper filters (`.eq()`, `.filter()`, etc.)
3. Use `.select()` for joins with related tables
4. Consider RLS policies
5. Use `.single()` or `.maybeSingle()` appropriately

**State management**:
1. Create store in `src/stores/`
2. Use Composition API pattern with `ref()` and `computed()`
3. Import and use in components with `useStore()`
4. Handle loading and error states

### File Naming Conventions

- **Components**: PascalCase (e.g., `CompletarCadastroPaciente.vue`)
- **Stores**: camelCase (e.g., `userContext.ts`)
- **Routes**: kebab-case (e.g., `novo-agendamento`)
- **Directories**: kebab-case (e.g., `agendamento`, `onboarding`)

### Import Order

1. Vue core imports (`vue`, `vue-router`, `pinia`)
2. External libraries (`@supabase/supabase-js`, `@vueuse/core`)
3. Stores (`@/stores/...`)
4. Components (`@/modules/...`)
5. Utils and types (`@/utils/...`, `@/lib/...`)

## Git Workflow

### Branch Naming
- Feature branches: `feature/feature-name`
- Bug fixes: `fix/bug-description`
- Claude AI branches: `claude/claude-md-{session-id}`

### Commit Messages
- Use clear, descriptive messages
- Focus on "why" rather than "what"
- Examples:
  - "Add patient registration form with validation"
  - "Fix appointment status update not persisting"
  - "Refactor authentication flow to use new Supabase API"

### Before Pushing
1. Run linting: `npm run lint`
2. Check types: `npm run type-check`
3. Test in development: `npm run dev`
4. Review changes: `git diff`

## Environment Setup

### Prerequisites
- Node.js 20+
- npm or yarn
- Supabase account and project

### Initial Setup
```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env  # If exists, otherwise create manually

# Add Supabase credentials to .env
VITE_SUPABASE_PROJECT=your_project_url
VITE_SUPABASE_APIKEY=your_anon_key

# Start development server
npm run dev
```

### IDE Recommendations
- **VSCode** with extensions:
  - Volar (Vue Language Features)
  - TypeScript Vue Plugin (Volar)
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense

## Additional Resources

- **Vue 3 Docs**: https://vuejs.org/
- **TypeScript Docs**: https://www.typescriptlang.org/
- **Pinia Docs**: https://pinia.vuejs.org/
- **Vue Router Docs**: https://router.vuejs.org/
- **Vite Docs**: https://vitejs.dev/
- **Supabase Docs**: https://supabase.com/docs
- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **Naive UI Docs**: https://www.naiveui.com/

---

**Last Updated**: 2025-12-09
**Project Version**: 0.0.0
