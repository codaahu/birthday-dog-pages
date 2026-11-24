<template>
  <main class="storage-error">
    <h1>暂时无法打开本机存档</h1>
    <p>请确认当前浏览器允许站点存储后重试。有备份的话请先保留。</p>
    <RouterLink class="secondary" :to="{ name: 'story', params: { moduleId: 'opening' } }">重试</RouterLink>
  </main>
</template>

<style scoped>
.storage-error { max-width: 34rem; margin: 12vh auto 0; }
</style>
