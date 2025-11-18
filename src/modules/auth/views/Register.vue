<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'

const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')

const formData = reactive({
  email: '',
  password: '',
  confirmPassword: '',
})

async function handleRegister() {
  errorMessage.value = ''

  // Validações
  if (!formData.email || !formData.password || !formData.confirmPassword) {
    errorMessage.value = 'Preencha todos os campos'
    return
  }

  if (formData.password !== formData.confirmPassword) {
    errorMessage.value = 'As senhas não coincidem'
    return
  }

  if (formData.password.length < 6) {
    errorMessage.value = 'A senha deve ter no mínimo 6 caracteres'
    return
  }

  try {
    loading.value = true

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    })

    if (error) {
      errorMessage.value = error.message
      return
    }

    if (data.user) {
      // Cadastro realizado com sucesso
      alert('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar.')
      router.push('/login')
    }
  } catch (error) {
    console.error('Erro no cadastro:', error)
    errorMessage.value = 'Erro ao realizar cadastro. Tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="grid grid-cols-2 h-screen">
    <section class="bg-neutral-100 px-40 py-28 overflow-auto">
      <div class="max-w-xl mx-auto">
        <img
          src="../../../assets/images/imedto-logo.png"
          alt=""
          aria-hidden="true"
          class="mb-10"
        />
        <h4 class="mb-4">Criar sua conta</h4>
        <p class="text-gray-800 mb-8">
          Preencha os campos abaixo para criar sua conta:
        </p>

        <!-- Alert de erro -->
        <div
          v-if="errorMessage"
          class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6"
        >
          {{ errorMessage }}
        </div>

        <form class="flex flex-col gap-8 border-b border-gray-300 pb-10 mb-6">
          <div>
            <label for="email" class="sr-only">E-mail</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              placeholder="E-mail"
              class="form-input"
              required
            />
          </div>

          <div>
            <label for="password" class="sr-only">Senha</label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              placeholder="Senha"
              class="form-input"
              required
            />
            <span class="text-xs text-gray-600">Mínimo de 6 caracteres</span>
          </div>

          <div>
            <label for="confirmPassword" class="sr-only">Confirmar senha</label>
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              placeholder="Confirme sua senha"
              class="form-input"
              required
            />
          </div>

          <button
            type="submit"
            class="btn-primary"
            :disabled="loading"
            @click.prevent="handleRegister"
          >
            {{ loading ? 'Cadastrando...' : 'Cadastrar' }}
          </button>
        </form>

        <p class="text-gray-800 text-center mb-4">Ou cadastre-se com:</p>
        <button type="button" class="btn-google">
          <img src="../../../assets/images/google-logo.png" alt="" />
          Google
        </button>
        <p class="text-center text-gray-800">
          Já tem uma conta?
          <router-link
            to="/login"
            class="text-primary hover:underline underline-offset-2 transition"
          >
            Faça login
          </router-link>
        </p>
      </div>
    </section>
    <section class="hero -scale-x-100"></section>
  </main>
</template>

<style scoped>
.hero {
  background:
    linear-gradient(
      0deg,
      rgba(255, 255, 255, 0.4) 0%,
      rgba(255, 255, 255, 0.4) 100%
    ),
    url('../../../assets/images/hero-1.png') lightgray top center / cover
      no-repeat;
}
</style>