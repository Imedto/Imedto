<template>
  <main>
    <n-config-provider
      :locale="ptBR"
      :date-locale="datePtBR"
      :theme-overrides="themeOverrides"
    >
      <Sidebar>
        <router-view></router-view>
      </Sidebar>
    </n-config-provider>
  </main>
</template>

<script setup lang="ts">
import { NConfigProvider, ptBR, datePtBR } from 'naive-ui'
import themeOverrides from '@/utils/naive_ui_theme'
import Sidebar from '../components/Sidebar.vue'
</script>
