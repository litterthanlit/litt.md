import os, glob

here = os.path.dirname(os.path.abspath(__file__))
shell = open(os.path.join(here, "shell.html"), encoding="utf-8").read()
files = sorted(glob.glob(os.path.join(here, "studies", "*.js")))

dev = "\n".join(
    '<script src="studies/%s"></script>' % os.path.basename(f) for f in files
)
open(os.path.join(here, "dev.html"), "w", encoding="utf-8").write(
    shell.replace("<!--STUDY_JS-->", dev)
)

inline = "\n".join(
    "<script>\n/* %s */\n%s\n</script>"
    % (os.path.basename(f), open(f, encoding="utf-8").read().replace("</script", "<\\/script"))
    for f in files
)
open(os.path.join(here, "studies.html"), "w", encoding="utf-8").write(
    shell.replace("<!--STUDY_JS-->", inline)
)
print(len(files), "rack studies built")
