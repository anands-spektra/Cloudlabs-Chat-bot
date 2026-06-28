import { useState } from 'react'
import { useChat } from '../../hooks/useChat'

type Step = 'deployment_id' | 'lab_name' | 'issue_summary' | 'description' | 'confirm' | 'done'

const STEPS: Step[] = ['deployment_id', 'lab_name', 'issue_summary', 'description', 'confirm']

const LABELS: Record<Step, string> = {
  deployment_id: 'Deployment ID',
  lab_name: 'Lab Name',
  issue_summary: 'Issue Summary (one line)',
  description: 'Detailed Description (optional)',
  confirm: 'Confirm',
  done: 'done',
}

const PLACEHOLDERS: Record<Step, string> = {
  deployment_id: 'e.g. dep-abc123',
  lab_name: 'e.g. AZ-900 Fundamentals',
  issue_summary: 'e.g. VM not starting',
  description: 'Describe the issue in detail...',
  confirm: '',
  done: '',
}

export default function EscalationCard() {
  const { escalateTicket } = useChat()
  const [step, setStep] = useState<Step>('deployment_id')
  const [data, setData] = useState({ deployment_id: '', lab_name: '', issue_summary: '', description: '' })
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (step === 'done') {
    const subject = `${data.lab_name} - ${data.issue_summary} - ${data.deployment_id}`
    return (
      <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
        <p className="font-semibold text-green-800 mb-1">Support ticket raised</p>
        <p className="text-green-700 text-xs">{subject}</p>
        <p className="text-green-600 text-xs mt-1">Our team will be in touch shortly.</p>
      </div>
    )
  }

  const next = (value: string) => {
    const current = step as Exclude<Step, 'confirm' | 'done'>
    setData((d) => ({ ...d, [current]: value }))
    const idx = STEPS.indexOf(step)
    setStep(STEPS[idx + 1])
    setInput('')
    setError('')
  }

  const submit = async () => {
    setSubmitting(true)
    setError('')
    try {
      await escalateTicket({
        deployment_id: data.deployment_id,
        lab_name: data.lab_name,
        issue_summary: data.issue_summary,
        detailed_description: data.description || undefined,
      })
      setStep('done')
    } catch {
      setError('Failed to raise ticket. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'confirm') {
    const subject = `${data.lab_name} - ${data.issue_summary} - ${data.deployment_id}`
    return (
      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm space-y-2">
        <p className="font-semibold text-amber-900">Review your support ticket</p>
        <dl className="text-xs space-y-1 text-gray-700">
          <div><dt className="inline font-medium">Subject: </dt><dd className="inline">{subject}</dd></div>
          {data.description && <div><dt className="inline font-medium">Description: </dt><dd className="inline">{data.description}</dd></div>}
        </dl>
        {error && <p className="text-red-600 text-xs">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button
            onClick={submit}
            disabled={submitting}
            className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? 'Raising…' : 'Raise Ticket'}
          </button>
          <button
            onClick={() => setStep('deployment_id')}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs hover:bg-gray-50"
          >
            Edit
          </button>
        </div>
      </div>
    )
  }

  const isDescription = step === 'description'
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isDescription && !input.trim()) return
    next(input.trim())
  }

  return (
    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">
      <p className="font-semibold text-blue-900 mb-2">Raise a Support Ticket</p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <label className="block text-xs text-gray-600 font-medium">{LABELS[step]}</label>
        {isDescription ? (
          <textarea
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDERS[step]}
            rows={3}
            className="w-full text-xs rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
          />
        ) : (
          <input
            autoFocus
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDERS[step]}
            className="w-full text-xs rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700"
          >
            {isDescription ? 'Next' : 'Next →'}
          </button>
          {isDescription && (
            <button
              type="button"
              onClick={() => next('')}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs hover:bg-gray-50"
            >
              Skip
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
