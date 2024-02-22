import logo from './logo.svg';
import './App.css';

function App() {
  return (
      <div className="bg-gray-100">
        {/* Hero Card */}
        <div className="bg-white shadow-lg p-8 mx-auto rounded-lg mt-8">
          {/* Hero Card Content */}
          <h1 className="text-3xl font-bold mb-4">Welcome to My Portfolio</h1>
          <p className="text-gray-600">I am a passionate developer showcasing my work.</p>
        </div>

        {/* Projects */}
        <div className="bg-white shadow-lg p-8 mx-auto rounded-lg mt-8">
          {/* Project 1 */}
          <div className="mb-4">
            <h2 className="text-xl font-bold">Project 1</h2>
            <p className="text-gray-600">Description of Project 1</p>
          </div>

          {/* Project 2 */}
          <div className="mb-4">
            <h2 className="text-xl font-bold">Project 2</h2>
            <p className="text-gray-600">Description of Project 2</p>
          </div>

          {/* Project 3 */}
          <div className="mb-4">
            <h2 className="text-xl font-bold">Project 3</h2>
            <p className="text-gray-600">Description of Project 3</p>
          </div>
        </div>

        {/* Work Experience */}
        <div className="bg-white shadow-lg p-8 mx-auto rounded-lg mt-8">
          {/* Work Experience Content */}
          <h2 className="text-2xl font-bold mb-4">Work Experience</h2>
          <ul className="list-disc pl-4">
            <li>Company 1 - Position 1</li>
            <li>Company 2 - Position 2</li>
            <li>Company 3 - Position 3</li>
          </ul>
        </div>

        {/* Contact Me */}
        <div className="bg-white shadow-lg p-8 mx-auto rounded-lg mt-8">
          {/* Contact Me Content */}
          <h2 className="text-2xl font-bold mb-4">Contact Me</h2>
          <p className="text-gray-600">Feel free to reach out to me at example@example.com</p>
        </div>
      </div>
  );
}

export default App;
