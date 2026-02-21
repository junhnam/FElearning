/**
 * データ整合性チェックスクリプト
 * 問題・レジュメの JSON バリデーション
 */
const fs = require('fs')
const path = require('path')

const errors = []
let totalQuestions = 0
let totalResumes = 0
const questionIds = new Set()

function walkDir(dir, handler) {
  if (!fs.existsSync(dir)) return
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fp = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkDir(fp, handler)
    } else if (entry.name.endsWith('.json')) {
      handler(fp)
    }
  }
}

// 問題ファイル検証
walkDir('data/questions', (fp) => {
  try {
    const data = JSON.parse(fs.readFileSync(fp, 'utf-8'))
    if (!Array.isArray(data)) {
      errors.push(fp + ': not an array')
      return
    }
    totalQuestions += data.length
    for (const q of data) {
      if (questionIds.has(q.questionId)) {
        errors.push(fp + ': duplicate id ' + q.questionId)
      }
      questionIds.add(q.questionId)
      if (!q.questionId || !q.question || !q.choices) {
        errors.push(fp + ': missing fields in ' + q.questionId)
      }
      if (q.level < 1 || q.level > 10) {
        errors.push(fp + ': invalid level in ' + q.questionId)
      }
      const correctCount = q.choices.filter(c => c.isCorrect).length
      if (correctCount !== 1) {
        errors.push(fp + ': ' + correctCount + ' correct answers in ' + q.questionId)
      }
      for (const c of q.choices) {
        if (!c.explanation) {
          errors.push(fp + ': missing explanation in ' + q.questionId + '/' + c.id)
        } else if (!c.explanation.analogy) {
          errors.push(fp + ': missing analogy in ' + q.questionId + '/' + c.id)
        }
      }
      if (!q.overallExplanation) {
        errors.push(fp + ': missing overallExplanation in ' + q.questionId)
      }
      // 科目B: 擬似言語・アルゴリズム・データ構造カテゴリは traceTable チェック
      const traceRequiredCategories = ['pseudo-language-trace', 'algorithm-sort-search', 'data-structures']
      if (traceRequiredCategories.includes(q.subcategory) && q.pseudoCode && !q.traceTable) {
        errors.push(fp + ': missing traceTable for pseudoCode question ' + q.questionId)
      }
    }
  } catch (e) {
    errors.push(fp + ': parse error - ' + e.message)
  }
})

// レジュメファイル検証
walkDir('data/resume', (fp) => {
  try {
    const raw = JSON.parse(fs.readFileSync(fp, 'utf-8'))
    const sections = Array.isArray(raw) ? raw : [raw]
    for (const data of sections) {
      totalResumes++
      if (!data.sectionId) {
        errors.push(fp + ': missing sectionId')
      }
      if (!data.overview || !data.overview.analogy) {
        errors.push(fp + ': missing overview.analogy in ' + (data.sectionId || 'unknown'))
      }
      if (!data.keyTerms || data.keyTerms.length === 0) {
        errors.push(fp + ': missing keyTerms in ' + (data.sectionId || 'unknown'))
      } else {
        for (const t of data.keyTerms) {
          if (!t.analogy) {
            errors.push(fp + ': missing analogy for term ' + t.term + ' in ' + data.sectionId)
          }
        }
      }
      if (!data.relatedQuestions) {
        errors.push(fp + ': missing relatedQuestions in ' + data.sectionId)
      }
    }
  } catch (e) {
    errors.push(fp + ': parse error - ' + e.message)
  }
})

// レジュメの relatedQuestions が実在する questionId を参照しているか
walkDir('data/resume', (fp) => {
  try {
    const raw = JSON.parse(fs.readFileSync(fp, 'utf-8'))
    const sections = Array.isArray(raw) ? raw : [raw]
    for (const data of sections) {
      for (const qid of (data.relatedQuestions || [])) {
        if (!questionIds.has(qid)) {
          errors.push(fp + ': relatedQuestion "' + qid + '" not found in question data (' + data.sectionId + ')')
        }
      }
    }
  } catch (e) { /* already reported */ }
})

console.log('=== Data Validation Report ===')
console.log('Total questions:', totalQuestions)
console.log('Total resume sections:', totalResumes)
console.log('Question IDs:', questionIds.size)
console.log('')

if (errors.length === 0) {
  console.log('All validations passed!')
} else {
  console.log('Errors:', errors.length)
  for (const e of errors) {
    console.log('  -', e)
  }
}
