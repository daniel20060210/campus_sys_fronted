/**
 * Pinia Store 入口文件
 */
import { createPinia } from 'pinia'

const pinia = createPinia()

export default pinia

export * from './user'
export * from './schoolFilter'
export * from './config'
