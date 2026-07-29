with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("              size: file.size\n           });\n         };\n         reader.readAsDataURL(file);", "              size: file.size\n           }]);\n         };\n         reader.readAsDataURL(file);")
content = content.replace("          timestamp: new Date(),\n        });\n    } catch (err: any) {", "          timestamp: new Date(),\n        }]);\n    } catch (err: any) {")
content = content.replace("        text: `متاسفانه مشکلی در برقراری ارتباط با سرور رخ داد: ${err.message || \"خطای ناشناخته\"}. لطفا دوباره تلاش کنید.`,\n        timestamp: new Date(),\n      });\n    } finally {", "        text: `متاسفانه مشکلی در برقراری ارتباط با سرور رخ داد: ${err.message || \"خطای ناشناخته\"}. لطفا دوباره تلاش کنید.`,\n        timestamp: new Date(),\n      }]);\n    } finally {")

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)
