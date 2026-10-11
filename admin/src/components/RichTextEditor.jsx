import React, { useMemo, useRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

/** Free, locally bundled editor. No API key or paid TinyMCE plan is needed. */
const RichTextEditor = ({ value, onChange, uploadImage }) => {
  const editorRef = useRef(null);
  const uploadImageRef = useRef(uploadImage);
  uploadImageRef.current = uploadImage;

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: [] }, { size: [] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        ["blockquote", "code-block"],
        ["link", "image", "video"],
        ["clean"],
      ],
      handlers: {
        image: () => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
              const url = await uploadImageRef.current(file);
              const editor = editorRef.current?.getEditor();
              if (!editor) return;
              const range = editor.getSelection(true);
              editor.insertEmbed(range.index, "image", url, "user");
              editor.setSelection(range.index + 1, 0);
            } catch (error) {
              alert(error.response?.data?.error || "Image upload failed");
            }
          };
          input.click();
        },
      },
    },
    clipboard: { matchVisual: false },
  }), []);

  return <div className="rich-text-editor quill-editor-wrap">
    <ReactQuill ref={editorRef} theme="snow" value={value || ""} onChange={onChange}
      modules={modules} formats={formats} placeholder="Write your blog content here..." />
  </div>;
};

const formats = ["header", "font", "size", "bold", "italic", "underline", "strike", "color", "background", "align", "list", "indent", "blockquote", "code-block", "link", "image", "video"];

export default RichTextEditor;
