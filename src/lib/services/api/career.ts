import { apiClient, orUndefined, toPatch } from "@/lib/api/client"
import type {
  Application,
  ApplicationInput,
  ApplicationStatus,
  Company,
  CompanyInput,
  Contact,
  ContactInput,
  ID,
  Interview,
  InterviewInput,
  Referral,
  ReferralInput,
  Resume,
  ResumeInput,
  TimelineEvent,
} from "@/lib/types"

import type { ApplicationService, CompanyService, ContactService, ResumeService } from "../contracts"
import { ApiCrudService } from "./crud"

const enc = encodeURIComponent

export class ApiApplicationService implements ApplicationService {
  getApplications(): Promise<Application[]> {
    return apiClient.get("/applications")
  }

  getApplication(id: ID): Promise<Application | undefined> {
    return orUndefined(apiClient.get(`/applications/${enc(id)}`))
  }

  createApplication(input: ApplicationInput): Promise<Application> {
    return apiClient.post("/applications", input)
  }

  updateApplication(id: ID, patch: Partial<ApplicationInput>): Promise<Application> {
    return apiClient.put(`/applications/${enc(id)}`, toPatch(patch))
  }

  changeStatus(id: ID, status: ApplicationStatus): Promise<Application> {
    return apiClient.put(`/applications/${enc(id)}/status`, { status })
  }

  addTimelineEvent(id: ID, event: Omit<TimelineEvent, "id">): Promise<Application> {
    return apiClient.post(`/applications/${enc(id)}/timeline`, event)
  }

  deleteApplication(id: ID): Promise<void> {
    return apiClient.delete(`/applications/${enc(id)}`)
  }
}

export class ApiCompanyService implements CompanyService {
  private readonly crud = new ApiCrudService<Company, CompanyInput>("/companies")
  getCompanies = () => this.crud.list()
  getCompany = (id: ID) => this.crud.get(id)
  createCompany = (input: CompanyInput) => this.crud.create(input)
  updateCompany = (id: ID, patch: Partial<CompanyInput>) => this.crud.update(id, patch)
  deleteCompany = (id: ID) => this.crud.remove(id)
}

export class ApiContactService implements ContactService {
  private readonly crud = new ApiCrudService<Contact, ContactInput>("/contacts")
  getContacts = () => this.crud.list()
  getContact = (id: ID) => this.crud.get(id)
  createContact = (input: ContactInput) => this.crud.create(input)
  updateContact = (id: ID, patch: Partial<ContactInput>) => this.crud.update(id, patch)
  deleteContact = (id: ID) => this.crud.remove(id)
}

export class ApiReferralService extends ApiCrudService<Referral, ReferralInput> {
  constructor() {
    super("/referrals")
  }
}

export class ApiInterviewService extends ApiCrudService<Interview, InterviewInput> {
  constructor() {
    super("/interviews")
  }
}

export class ApiResumeService implements ResumeService {
  private readonly crud = new ApiCrudService<Resume, ResumeInput>("/resumes")
  getResumes = () => this.crud.list()
  getResume = (id: ID) => this.crud.get(id)
  createResume = (input: ResumeInput) => this.crud.create(input)
  updateResume = (id: ID, patch: Partial<ResumeInput>) => this.crud.update(id, patch)
  deleteResume = (id: ID) => this.crud.remove(id)

  duplicateResume(id: ID): Promise<Resume> {
    return apiClient.post(`/resumes/${enc(id)}/duplicate`)
  }

  setDefaultResume(id: ID): Promise<Resume[]> {
    return apiClient.put(`/resumes/${enc(id)}/default`)
  }

  async compileLatex(source: string): Promise<Blob> {
    const { pdfBase64 } = await apiClient.post<{ pdfBase64: string }>("/latex/compile", { source })
    const bytes = Uint8Array.from(atob(pdfBase64), (char) => char.charCodeAt(0))
    return new Blob([bytes], { type: "application/pdf" })
  }
}
