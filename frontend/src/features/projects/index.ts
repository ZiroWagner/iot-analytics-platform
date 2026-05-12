export * from './domain'
export { httpProjectsRepository } from './infrastructure/projects.repository'
export type { ProjectsRepository } from './infrastructure/projects.repository'
export {
  OverviewPage,
  ProjectsPage,
  useProjects,
  useOverview,
} from './presentation'
