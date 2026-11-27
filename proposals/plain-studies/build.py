import os, glob

here = os.path.dirname(os.path.abspath(__file__))
shell = open(os.path.join(here, "shell.html")).read()
data_files = sorted(glob.glob(os.path.join(here, "data", "*.js")))
study_files = sorted(glob.glob(os.path.join(here, "studies", "*.js")))
all_files = data_files + study_files

inline = "\n".join(
    "<script>\n/* %s */\n%s\n</script>"
    % (os.path.basename(f), open(f).read().replace("</script", "<\\/script"))
    for f in all_files
)
open(os.path.join(here, "studies.html"), "w").write(shell.replace("<!--STUDY_JS-->", inline))
print(len(data_files), "data components,", len(study_files), "agentic studies")
