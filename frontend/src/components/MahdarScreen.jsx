import { useState } from "react"

function MahdarScreen({ date, title, purpose, location, attendees, discussion, decisions, action_items, next_meeting, template }) {
  // Metadata
  const [edit_date, setDate] = useState(date);
  const [edit_title, setTitle] = useState(title);
  const [edit_purpose, setPurpose] = useState(purpose);
  const [edit_location, setLocation] = useState(location);
  const [edit_next_meeting, setNextMeeting] = useState(next_meeting);
  
  // Attendees
  const [edit_attendees, setAttendees] = useState(attendees);

  // Details
  const [edit_discussion, setDiscussion] = useState(discussion);
  const [edit_decisions, setDicisions] = useState(decisions);

  // Action Items
  const [edit_actionItems, setActionItems] = useState(action_items);

  const handleExport = async () => {
    if (!template) return alert("Please upload a Word template first!");

    const formData = new FormData();
    formData.append("template", template);
    formData.append("date", edit_date);
    formData.append("title", edit_title);
    formData.append("location", edit_location);
    formData.append("attendees", edit_attendees.join(", "));
    formData.append("purpose", edit_purpose);
    formData.append("discussion", edit_discussion);
    formData.append("decisions", edit_decisions);
    formData.append("next_meeting", edit_next_meeting);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/export`, {
        method: "POST",
        body: formData
    });

    const currentDateTime = new Date().toISOString();
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mahdar_report_${currentDateTime}.docx`;
    a.click();

  };
  return (
    <div>
      <h1>Mahdar Report 📝</h1>
      <hr style={{ borderTop: '1px solid #ccc', margin: '20px 0' }} />
      <div style={{ display: 'flex', gap: '20px' }}>
        <h4>Metadata</h4>
        <label>
            Date:
            <textarea
              value={edit_date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="could'nt infer date from recording..."
             />
        </label>
        <label>
            title:
            <textarea
              value={edit_title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="could'nt infer title from recording..."
             />
        </label>
        <label>
            location:
            <textarea
              value={edit_location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="could'nt infer location from recording..."
             />
        </label>
        <label>
            Next Meeting Date:
            <textarea
              value={edit_next_meeting}
              onChange={(e) => setNextMeeting(e.target.value)}
              placeholder="could'nt infer Next Meeting from recording..."
             />
        </label>
      </div>
      <hr style={{ borderTop: '1px solid #ccc', margin: '20px 0' }} />
      <div style={{ display: 'flex', gap: '20px' }}>
        <h4>Attendees</h4>
        {edit_attendees.map((name, index) => (
            <textarea
              key={index}
              defaultValue={name}
            />
        ))}
      </div>
      <hr style={{ borderTop: '1px solid #ccc', margin: '20px 0' }} />
      <div>
        <h4>Details</h4>
        <label>
            Purpose:
            <textarea
              value={edit_purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="could'nt infer purpose from recording..."
             />
        </label>
        <label>
            discussion:
            <textarea
              value={edit_discussion}
              onChange={(e) => setDiscussion(e.target.value)}
              placeholder="could'nt infer discussion from recording..."
             />
        </label>
        <label>
            dicisions:
            <textarea
              value={edit_decisions}
              onChange={(e) => setDicisions(e.target.value)}
              placeholder="could'nt infer dicisions from recording..."
             />
        </label>
      </div>
      <hr style={{ borderTop: '1px solid #ccc', margin: '20px 0' }} />
      <div>
        <h4>Action Items</h4>
        {action_items.map((action_item, index) => (
        <div style={{ display: 'flex', gap: '20px' }}>
            <label>
                Task
                <textarea
                key={index}
                defaultValue={action_item.task}
            />
            </label>
            <label>
                Owner
                <textarea
                key={index}
                defaultValue={action_item.owner}
            />
            </label>
            <label>
                Deadline
                <textarea
                key={index}
                defaultValue={action_item.deadline}
            />
            </label>
        </div>
        ))}
      </div>
      <div>
        <button onClick={handleExport}>📄 Export to Word</button>
      </div>
    </div>
  )
}

export default MahdarScreen