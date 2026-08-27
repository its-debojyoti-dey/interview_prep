import { useState, useEffect } from 'react';
import { FileText, Save, CheckCircle2, Download, Sparkles } from 'lucide-react';

interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  summary: string;
  skills: string;
  experience: { company: string; role: string; dates: string; bullets: string }[];
  education: { degree: string; school: string; dates: string }[];
}

export const ResumeEditor = () => {
  const [resume, setResume] = useState<ResumeData>(() => {
    const saved = localStorage.getItem('interview_prep_resume_data');
    if (saved) return JSON.parse(saved);
    return {
      fullName: 'Debojyoti Dey',
      email: 'debojyoti@example.com',
      phone: '+1 (555) 019-2834',
      location: 'San Francisco, CA',
      linkedin: 'linkedin.com/in/debojyotidey',
      github: 'github.com/debojyoti',
      summary: 'Senior Software Engineer with 5+ years experience building distributed microservices, real-time streaming architectures, and high-throughput backend applications.',
      skills: 'TypeScript, React, Node.js, Go, Python, PostgreSQL, Redis, Kafka, Docker, Kubernetes, AWS S3, System Design',
      experience: [
        {
          company: 'Tech Scale-Up',
          role: 'Senior Software Engineer',
          dates: '2023 - Present',
          bullets: '• Architected real-time WebSocket messaging service handling 100K active connections.\n• Decreased database read latency by 65% through Redis consistent hash caching.\n• Led migration of monolithic backend to event-driven Kafka microservices.'
        }
      ],
      education: [
        {
          degree: 'B.S. in Computer Science',
          school: 'Tech University',
          dates: '2017 - 2021'
        }
      ]
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    localStorage.setItem('interview_prep_resume_data', JSON.stringify(resume));
  }, [resume]);

  const handleSave = () => {
    localStorage.setItem('interview_prep_resume_data', JSON.stringify(resume));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const calculateAtsScore = () => {
    let score = 50;
    if (resume.summary.length > 50) score += 10;
    if (resume.skills.split(',').length >= 5) score += 15;
    if (resume.experience.length >= 1) score += 15;
    if (resume.education.length >= 1) score += 10;
    return Math.min(100, score);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Resume Editor & ATS Optimizer
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Build and fine-tune your technical resume for Applicant Tracking Systems (ATS).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Resume
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Form + Live Preview */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Form Inputs */}
        <div className="space-y-5 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200">Personal & Contact Info</h2>
            <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              ATS Score: {calculateAtsScore()}%
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Full Name</label>
              <input
                type="text"
                value={resume.fullName}
                onChange={(e) => setResume({ ...resume, fullName: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Email</label>
              <input
                type="text"
                value={resume.email}
                onChange={(e) => setResume({ ...resume, email: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Phone</label>
              <input
                type="text"
                value={resume.phone}
                onChange={(e) => setResume({ ...resume, phone: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Location</label>
              <input
                type="text"
                value={resume.location}
                onChange={(e) => setResume({ ...resume, location: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Professional Summary</label>
            <textarea
              rows={3}
              value={resume.summary}
              onChange={(e) => setResume({ ...resume, summary: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Technical Skills (Comma separated)</label>
            <textarea
              rows={2}
              value={resume.skills}
              onChange={(e) => setResume({ ...resume, skills: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Work Experience */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300">Work Experience</h3>
            {resume.experience.map((exp, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
                <div className="grid sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) => {
                      const updated = [...resume.experience];
                      updated[idx].company = e.target.value;
                      setResume({ ...resume, experience: updated });
                    }}
                    className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="Role"
                    value={exp.role}
                    onChange={(e) => {
                      const updated = [...resume.experience];
                      updated[idx].role = e.target.value;
                      setResume({ ...resume, experience: updated });
                    }}
                    className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="Dates (2023 - Present)"
                    value={exp.dates}
                    onChange={(e) => {
                      const updated = [...resume.experience];
                      updated[idx].dates = e.target.value;
                      setResume({ ...resume, experience: updated });
                    }}
                    className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200"
                  />
                </div>
                <textarea
                  rows={3}
                  placeholder="Achievement bullet points..."
                  value={exp.bullets}
                  onChange={(e) => {
                    const updated = [...resume.experience];
                    updated[idx].bullets = e.target.value;
                    setResume({ ...resume, experience: updated });
                  }}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Live Resume Document Preview */}
        <div className="bg-white text-slate-900 rounded-xl p-8 shadow-xl font-serif space-y-6 min-h-[500px]">
          {/* Resume Header */}
          <div className="border-b border-slate-300 pb-4 text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">{resume.fullName}</h1>
            <p className="text-xs text-slate-600 font-sans">
              {resume.email} • {resume.phone} • {resume.location}
            </p>
            <p className="text-xs text-indigo-700 font-sans font-medium">
              {resume.linkedin} • {resume.github}
            </p>
          </div>

          {/* Summary */}
          <div className="space-y-1">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans border-b border-slate-200 pb-1">
              Summary
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">{resume.summary}</p>
          </div>

          {/* Technical Skills */}
          <div className="space-y-1">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans border-b border-slate-200 pb-1">
              Technical Skills
            </h2>
            <p className="text-xs text-slate-800 font-sans font-medium">{resume.skills}</p>
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans border-b border-slate-200 pb-1">
              Professional Experience
            </h2>
            {resume.experience.map((exp, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="font-bold text-slate-900">{exp.role} — <span className="italic">{exp.company}</span></span>
                  <span className="text-slate-500">{exp.dates}</span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                  {exp.bullets}
                </p>
              </div>
            ))}
          </div>

          {/* Education */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans border-b border-slate-200 pb-1">
              Education
            </h2>
            {resume.education.map((edu, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-sans">
                <span className="font-bold text-slate-900">{edu.degree} — <span className="italic">{edu.school}</span></span>
                <span className="text-slate-500">{edu.dates}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
