import { articleRepository } from "../repositories/repositories"
import { DBArticle } from "../db/schema"

export type Article = DBArticle

export const articleService = {
  getAllArticles: async (): Promise<Article[]> => {
    return await articleRepository.findAll()
  },

  getActiveArticles: async (): Promise<Article[]> => {
    return await articleRepository.findActive()
  },

  createArticle: async (article: Partial<Article>): Promise<Article> => {
    if (!article.name || !article.name.trim()) throw new Error("Article name is required")
    return await articleRepository.create({
      name: article.name.trim(),
      description: article.description || "",
      unit: article.unit || "Box",
      fragile: article.fragile ?? false,
      status: article.status || "active"
    })
  },

  updateArticle: async (id: string, updates: Partial<Article>): Promise<Article | null> => {
    const existing = await articleRepository.findById(id)
    if (!existing) return null
    const updated: Article = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    return await articleRepository.save(updated)
  },

  deleteArticle: async (id: string): Promise<boolean> => {
    return await articleRepository.softDelete(id)
  }
}
