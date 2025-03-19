import React from 'react';
import { workData } from '../data/workData';
import '../index.css';

const WorkSection = () => {
    return (
        <section id='experience' className="py-8">
        <div className="space-y-6 pb-12 px-4 md:px-64">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
                Work Experience
            </h2>
            {workData.map((job) => (
                <div key={job.id} className={`flex flex-col ${job.id % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'} rounded-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition duration-300`}>
                    {job.roles.length === 1 ? (
                        <div>
                        <div className="flex flex-col sm:flex-row items-center pr-6 pt-6 pl-6">
                            <img src={job.image} alt={`${job.company} logo`} className="w-16 h-16 mb-3 sm:mb-0 sm:mr-4" />
                            <div className="text-center sm:text-left">
                                <h3 className="text-xl sm:text-2xl font-bold">{job.roles[0].title}</h3>
                                <p className="text-sm text-gray-500">{job.company} · {job.roles[0].type}</p>
                            </div>
                        </div>
                            <div className="px-6 sm:pl-24 sm:pr-6 pb-6 mt-3">
                                <ul className="list-disc space-y-2 list-inside mt-2 text-gray-700">
                                {job.roles[0].description.map((description, index) => (
                                    <li key={`${job.id}-${index}`}>{description}</li>
                                ))}
                                </ul>
                            <p className="text-right text-gray-500 italic pt-4">{job.roles[0].startDate} - {job.roles[0].endDate}</p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex flex-col sm:flex-row items-center pr-6 pt-6 pl-6 pb-2">
                                <img src={job.image} alt={`${job.company} logo`} className="w-16 h-16 mb-3 sm:mb-0 sm:mr-4" />
                                <div className="text-center sm:text-left">
                                    <h4 className="text-xl sm:text-2xl font-bold">{job.company}</h4>
                                    <p className="text-sm text-gray-500">{job.roles[0].type}</p>
                                </div>
                            </div>
                            <div className="px-6 sm:pl-24 sm:pr-6 pb-6 relative mt-3">
                                {job.roles.map((role, index) => (
                                    <div key={index} className="relative mt-4 first:mt-0">
                                        <h4 className="text-xl font-semibold">{role.title}</h4>
                                        <p className="text-gray-500">{role.startDate} - {role.endDate}</p>
                                        <ul className="list-disc space-y-2 list-inside mt-2 text-gray-700">
                                            {role.description.map((description, index) => (
                                                <li key={index}>{description}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                                <p className="text-right text-gray-500 italic pt-4">{job.overallDuration}</p>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    </section>
    );
};

export default WorkSection;
